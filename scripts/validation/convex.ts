/**
 * Guarded Convex CLI wrapper: `bun run vconvex -- [--app-port P] <convex args>`.
 *
 * Runs the CLI in anonymous agent mode with USERPROFILE/HOME pointed at
 * ~/.uvs-validation/backends/<P>/, so the owner's Convex login is invisible, and pins the
 * backend to the fixed ports from ports.ts. guard.ts refuses anything that could reach a
 * cloud deployment.
 *
 * Wrapper flags: `--app-port P` (else UVS_APP_PORT, else the port registry), `--print-target`
 * (run the guard, print the target, exit without calling the CLI), `--repoint-env-local`
 * (rewrite `.env.local`'s loopback Convex URLs for P instead of refusing when they point at
 * another backend), `--log-file <path>` (append all output there; backend.ts uses it for the
 * detached dev watcher), and `--fetch-pinned-backend` (let `dev` download the pinned backend
 * release assets from github.com once, when they aren't cached).
 */
import { spawn, spawnSync, type ChildProcess, type StdioOptions } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ANONYMOUS_DEPLOYMENT,
  GuardError,
  PINNED_CHILD_ENV,
  PINNED_LOCAL_BACKEND_VERSION,
  assertGuard,
  guardReport,
  parseDotenv,
  readCliEnvFiles,
  resolveCliTarget,
  type Env,
  type GuardInput,
  type TargetClass,
} from "./guard";
import {
  backendDir,
  defaultValidationRoot,
  loopbackUrl,
  portsFor,
  resolveAppPort,
  sharedCacheDir,
  type BackendPorts,
} from "./ports";
import { isLoopbackUrl } from "../../convex/lib/validationBackend";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CONVEX_PACKAGE = path.join(REPO_ROOT, "node_modules", "convex");
export const CONVEX_BIN = path.join(CONVEX_PACKAGE, "bin", "main.js");

export function installedConvexVersion(pkgDir = CONVEX_PACKAGE): string {
  return (JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8")) as { version: string }).version;
}

/** Dropped from the wrapped env (any letter case). The pinned vars are then set explicitly. */
const STRIPPED_ENV = ["UVS_APP_PORT", "NODE_OPTIONS"];
const STRIPPED_PREFIXES = ["DOTENV_"];

/** Env names are always compared case-insensitively, so `convex_deploy_key` can't sneak past. */
function deleteKey(env: Env, key: string) {
  for (const existing of Object.keys(env)) {
    if (existing.toUpperCase() === key.toUpperCase()) delete env[existing];
  }
}

function setKey(env: Env, key: string, value: string) {
  deleteKey(env, key);
  env[key] = value;
}

export function buildChildEnv(opts: {
  parentEnv: Env;
  appPort: number;
  root: string;
  platform?: NodeJS.Platform;
}): Env {
  const platform = opts.platform ?? process.platform;
  const env: Env = { ...opts.parentEnv };
  for (const key of STRIPPED_ENV) deleteKey(env, key);
  for (const key of Object.keys(env)) {
    if (STRIPPED_PREFIXES.some((p) => key.toUpperCase().startsWith(p))) delete env[key];
  }
  for (const [key, value] of Object.entries(PINNED_CHILD_ENV)) setKey(env, key, value);
  const home = backendDir(opts.appPort, opts.root);
  setKey(env, "USERPROFILE", home);
  setKey(env, "HOME", home);
  // A per-backend temp dir marks the backend's node executor so orphans can be found and killed.
  for (const key of platform === "win32" ? ["TEMP", "TMP"] : ["TMPDIR"]) setKey(env, key, backendTempDir(home));
  if (platform === "win32") setKey(env, "LOCALAPPDATA", sharedCacheDir(opts.root));
  return env;
}

const ENV_LINE = /^(\s*(?:export\s+)?)([\w.-]+)(\s*=\s*|:\s+)(.*)$/;

/**
 * Points `.env.local`'s loopback Convex URLs at this app port's backend. Returns the keys it
 * rewrote. Only used with `--repoint-env-local`; non-loopback URLs are left for the guard to refuse.
 */
export function repointEnvLocal(file: string, ports: BackendPorts): string[] {
  if (!fs.existsSync(file)) return [];
  const changed: string[] = [];
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const out = lines.map((line) => {
    const m = ENV_LINE.exec(line);
    if (!m || !/CONVEX.*URL/.test(m[2].toUpperCase())) return line;
    const value = parseDotenv(`X=${m[4]}`).X ?? "";
    if (!isLoopbackUrl(value)) return line;
    const target = loopbackUrl(/SITE/.test(m[2].toUpperCase()) ? ports.site : ports.cloud);
    if (new URL(value).port === new URL(target).port) return line;
    changed.push(m[2]);
    return `${m[1]}${m[2]}${m[3]}${target}`;
  });
  if (changed.length > 0) fs.writeFileSync(file, out.join("\n"));
  return changed;
}

export function killProcessTree(pid: number) {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
}

/**
 * Kills every process tree whose command line mentions this backend's dir: the detached `vconvex
 * dev` wrapper (its `--log-file` is in the dir), the backend binary (its storage is in the dir),
 * and node executors (their temp dir is in the dir). Used by `stop`, so a `start` that was
 * interrupted between steps can't leave anything running. Returns the PIDs it found.
 */
export function killBackendProcesses(home: string): number[] {
  if (process.platform === "win32") {
    const literal = `'${home.replace(/'/g, "''")}'`;
    const command =
      `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -and $_.CommandLine.Contains(${literal}) } | ` +
      `ForEach-Object { $_.ProcessId; taskkill /PID $_.ProcessId /T /F *> $null }`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8" });
    return result.stdout.split(/\s+/).filter(Boolean).map(Number);
  }
  const found = spawnSync("pgrep", ["-f", home], { encoding: "utf8" });
  const pids = (found.stdout ?? "").split(/\s+/).filter(Boolean).map(Number).filter((p) => p !== process.pid);
  for (const pid of pids) killProcessTree(pid);
  return pids;
}

export function backendTempDir(home: string): string {
  return path.join(home, "tmp");
}

/**
 * The local backend runs "use node" actions in a `node local.cjs` executor. When the CLI stops the
 * backend on Windows (TerminateProcess), that executor is orphaned and keeps the caller's stdout
 * pipe open. Kill node processes running from this backend's temp dir. Returns the PIDs killed.
 */
export function killBackendExecutors(home: string): number[] {
  const tmp = backendTempDir(home);
  if (process.platform === "win32") {
    const literal = `'${tmp.replace(/'/g, "''")}'`;
    const command = `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains(${literal}) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $_.ProcessId }`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8" });
    return result.stdout.split(/\s+/).filter(Boolean).map(Number);
  }
  const found = spawnSync("pgrep", ["-f", tmp], { encoding: "utf8" });
  const pids = (found.stdout ?? "").split(/\s+/).filter(Boolean).map(Number);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // already gone
    }
  }
  return pids;
}

/** Splits wrapper flags from Convex args and injects the fixed local ports for `dev`. */
export function splitArgs(argv: string[]): {
  appPortFlag?: string;
  printTarget: boolean;
  logFile?: string;
  repointEnvLocal: boolean;
  check: boolean;
  fetchPinnedBackend: boolean;
  convexArgs: string[];
} {
  const rest = argv[0] === "--" ? argv.slice(1) : [...argv];
  let appPortFlag: string | undefined;
  let logFile: string | undefined;
  let printTarget = false;
  let repointEnvLocal = false;
  let check = false;
  let fetchPinnedBackend = false;
  const convexArgs: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--app-port") appPortFlag = rest[++i];
    else if (arg.startsWith("--app-port=")) appPortFlag = arg.slice("--app-port=".length);
    else if (arg === "--print-target") printTarget = true;
    else if (arg === "--repoint-env-local") repointEnvLocal = true;
    else if (arg === "--check") check = true;
    else if (arg === "--fetch-pinned-backend") fetchPinnedBackend = true;
    else if (arg === "--log-file") logFile = rest[++i];
    else convexArgs.push(arg);
  }
  return { appPortFlag, printTarget, logFile, repointEnvLocal, check, fetchPinnedBackend, convexArgs };
}

/** `dev` gets the local backend on the fixed ports, at the pinned version. Other commands are untouched. */
export function withLocalBackendFlags(args: string[], ports: BackendPorts): string[] {
  const devIndex = args.findIndex((a) => !a.startsWith("-"));
  if (devIndex === -1 || args[devIndex] !== "dev") return args;
  return [
    ...args.slice(0, devIndex + 1),
    "--local",
    "--local-cloud-port",
    String(ports.cloud),
    "--local-site-port",
    String(ports.site),
    "--local-backend-version",
    PINNED_LOCAL_BACKEND_VERSION,
    ...args.slice(devIndex + 1),
  ];
}

export type Invocation = {
  appPort: number;
  ports: BackendPorts;
  home: string;
  childEnv: Env;
  cliArgs: string[];
  printTarget: boolean;
  fetchPinnedBackend: boolean;
  logFile?: string;
  target: { deployment: string; url: string; siteUrl: string; home: string };
};

type InvocationOptions = {
  argv: string[];
  parentEnv?: Env;
  cwd?: string;
  root?: string;
  realHome?: string;
  platform?: NodeJS.Platform;
  cliVersion?: string;
  /** Called with a message when `--repoint-env-local` rewrites `.env.local`. */
  onRepoint?: (message: string) => void;
};

function guardContext(opts: InvocationOptions) {
  const parentEnv = opts.parentEnv ?? process.env;
  const cwd = opts.cwd ?? REPO_ROOT;
  const root = opts.root ?? defaultValidationRoot();
  const platform = opts.platform ?? process.platform;
  const split = splitArgs(opts.argv);
  const appPort = resolveAppPort({ flag: split.appPortFlag, env: parentEnv, worktree: cwd, root });
  const ports = portsFor(appPort);
  const childEnv = buildChildEnv({ parentEnv, appPort, root, platform });
  const noArgs = split.check && split.convexArgs.length === 0;
  const cliArgs = withLocalBackendFlags(split.convexArgs, ports);
  const guardInput = (skipEnvLocalPort: boolean): GuardInput => {
    const files = readCliEnvFiles(cwd);
    return {
      args: noArgs ? null : split.convexArgs,
      cliArgs: noArgs ? undefined : cliArgs,
      sources: [{ name: "the caller's environment", env: parentEnv }, ...files.sources],
      envFiles: files.envFiles,
      vaultFiles: files.vaultFiles,
      projectLinked: files.projectLinked,
      parserError: files.parserError,
      childEnv,
      cliVersion: opts.cliVersion ?? installedConvexVersion(),
      appPort,
      root,
      realHome: opts.realHome ?? os.homedir(),
      platform,
      skipEnvLocalPort,
    };
  };
  return { ...split, cwd, root, appPort, ports, parentEnv, childEnv, cliArgs, guardInput };
}

export type CheckResult = {
  appPort: number;
  target: TargetClass;
  reason: string;
  rules: { rule: string; status: "pass" | "fail" | "skipped"; problems: number }[];
  ok: boolean;
};

/**
 * `vconvex --check`: runs the guard only and reports the resolved target class and which rules
 * passed. Rule names and counts only, never values. `ok` only when every rule passes and the
 * target is the wrapper's own local deployment.
 */
export function checkInvocation(opts: InvocationOptions): CheckResult {
  const ctx = guardContext(opts);
  const input = ctx.guardInput(false);
  const report = guardReport(input);
  const fileSources = input.sources.filter((s) => s.name === ".env.local" || s.name === ".env");
  const rules = report.map((r) => ({
    rule: r.rule,
    status: (r.skipped ? "skipped" : r.violations.length === 0 ? "pass" : "fail") as "pass" | "fail" | "skipped",
    problems: r.violations.length,
  }));
  const failed = rules.some((r) => r.status === "fail");
  const common = { fileSources, projectLinked: input.projectLinked, platform: input.platform };
  // All rules pass: report where the wrapped CLI goes. Otherwise report where this shell and these
  // env files point on their own (what a bare CLI would do), never calling a refused setup local.
  const resolved = failed
    ? resolveCliTarget({ ...common, childEnv: ctx.parentEnv })
    : resolveCliTarget({ ...common, childEnv: ctx.childEnv });
  const target: TargetClass = failed && resolved.target === "local" ? "unknown" : resolved.target;
  return {
    appPort: ctx.appPort,
    target,
    reason: target === resolved.target ? resolved.reason : "the env resolves locally, but other guard rules failed",
    rules,
    ok: !failed && target === "local",
  };
}

export function formatCheck(result: CheckResult): string {
  return [
    `vconvex check (app port ${result.appPort}): target=${result.target} (${result.reason})`,
    ...result.rules.map((r) => `  ${r.status.padEnd(7)} ${r.rule}${r.problems ? ` (${r.problems} problem${r.problems === 1 ? "" : "s"})` : ""}`),
    result.ok ? "OK: the wrapped CLI can only reach this worktree's local backend." : "NOT OK: vconvex would refuse to run.",
  ].join("\n");
}

/** Resolves the port, builds the wrapped env, and runs the guard. Throws GuardError on refusal. */
export function prepareInvocation(opts: InvocationOptions): Invocation {
  const { cwd, root, appPort, ports, childEnv, cliArgs, guardInput, printTarget, fetchPinnedBackend, logFile, repointEnvLocal: repoint } =
    guardContext(opts);
  if (repoint) {
    // Everything else must pass before the wrapper writes to .env.local.
    assertGuard(guardInput(true));
    const changed = repointEnvLocal(path.join(cwd, ".env.local"), ports);
    if (changed.length > 0) {
      (opts.onRepoint ?? console.error)(`[vconvex] repointed .env.local ${changed.join(", ")} at the app port ${appPort} backend`);
    }
  }
  assertGuard(guardInput(false));
  const home = backendDir(appPort, root);
  return {
    appPort,
    ports,
    home,
    childEnv,
    cliArgs,
    printTarget,
    fetchPinnedBackend,
    logFile,
    target: {
      deployment: ANONYMOUS_DEPLOYMENT,
      url: loopbackUrl(ports.cloud),
      siteUrl: loopbackUrl(ports.site),
      home,
    },
  };
}

function savedDeploymentConfig(home: string): string {
  const name = ANONYMOUS_DEPLOYMENT.slice("anonymous:".length);
  return path.join(home, ".convex", "anonymous-convex-backend-state", name, "config.json");
}

/** The CLI saves the ports a deployment was created with; refuse if they drifted from ports.ts. */
export function checkSavedDeploymentPorts(home: string, ports: BackendPorts): void {
  const config = savedDeploymentConfig(home);
  if (!fs.existsSync(config)) return;
  const saved = JSON.parse(fs.readFileSync(config, "utf8")) as { ports?: { cloud?: number; site?: number } };
  if (saved.ports && (saved.ports.cloud !== ports.cloud || saved.ports.site !== ports.site)) {
    throw new GuardError([
      `${config} uses ports ${saved.ports.cloud}/${saved.ports.site}, expected ${ports.cloud}/${ports.site}.`,
    ]);
  }
}

/**
 * A backend created at another version would make `dev` prompt to upgrade it (and download the
 * old binary if it declined), so refuse with the way out instead.
 */
export function checkSavedBackendVersion(home: string, appPort: number): void {
  const config = savedDeploymentConfig(home);
  if (!fs.existsSync(config)) return;
  const saved = JSON.parse(fs.readFileSync(config, "utf8")) as { backendVersion?: string };
  if (saved.backendVersion === undefined || saved.backendVersion === PINNED_LOCAL_BACKEND_VERSION) return;
  throw new Error(
    `The port ${appPort} backend was created with local backend ${saved.backendVersion}, but the wrapper pins ` +
      `${PINNED_LOCAL_BACKEND_VERSION} (PINNED_LOCAL_BACKEND_VERSION in scripts/validation/guard.ts). Its data is throwaway: run ` +
      `\`bun run validation:backend -- stop --app-port ${appPort}\`, delete ${path.dirname(path.dirname(config))}, then start it again.`,
  );
}

/** Where the CLI caches backend binaries and the dashboard (cacheDir() in cli/lib/utils/utils.js). */
function convexCacheDir(env: Env, platform: NodeJS.Platform): string {
  return platform === "win32" ? path.join(env.LOCALAPPDATA!, "convex") : path.join(env.HOME!, ".cache", "convex");
}

function ownerConvexCacheDir(opts: { parentEnv: Env; realHome: string; platform: NodeJS.Platform }): string {
  return opts.platform === "win32"
    ? path.join(opts.parentEnv.LOCALAPPDATA ?? path.join(opts.realHome, "AppData", "Local"), "convex")
    : path.join(opts.realHome, ".cache", "convex");
}

const backendExe = (platform: NodeJS.Platform) => (platform === "win32" ? "convex-local-backend.exe" : "convex-local-backend");

function dashboardVersion(cache: string): string | null {
  try {
    return (JSON.parse(fs.readFileSync(path.join(cache, "dashboard", "config.json"), "utf8")) as { version?: string }).version ?? null;
  } catch {
    return null;
  }
}

/**
 * What the CLI would download from github.com for the pinned version: the backend binary when
 * `binaries/<version>/` lacks it, and the dashboard when its config names another version
 * (ensureBackendBinaryDownloaded and ensureDashboardDownloaded in cli/lib/localDeployment/download.js).
 */
export function pinnedBackendCacheProblems(opts: { childEnv: Env; platform?: NodeJS.Platform }): string[] {
  const platform = opts.platform ?? process.platform;
  const cache = convexCacheDir(opts.childEnv, platform);
  const out: string[] = [];
  const exe = path.join(cache, "binaries", PINNED_LOCAL_BACKEND_VERSION, backendExe(platform));
  if (!fs.existsSync(exe)) out.push(`${exe} is missing`);
  const dashboard = dashboardVersion(cache);
  if (dashboard !== PINNED_LOCAL_BACKEND_VERSION) {
    out.push(`${path.join(cache, "dashboard")} is ${dashboard ? `at ${dashboard}` : "missing"}, not ${PINNED_LOCAL_BACKEND_VERSION}`);
  }
  return out;
}

/** Copies `source` to `dest` through a temp dir next to it, so a half-copied dir is never seen. */
function copyDirAtomically(source: string, dest: string): boolean {
  const partial = path.join(path.dirname(dest), `.${path.basename(dest)}-partial-${process.pid}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.cpSync(source, partial, { recursive: true });
    fs.rmSync(dest, { recursive: true, force: true });
    fs.renameSync(partial, dest);
    return true;
  } catch {
    // Another run seeded it first, or the copy failed; the cache check reports what is missing.
    return false;
  } finally {
    fs.rmSync(partial, { recursive: true, force: true });
  }
}

/**
 * Copies the pinned backend binary (130MB) and the dashboard, when the owner's cache has them at
 * the pinned version, into the wrapped CLI's cache. The owner's cache is only read. Returns what
 * it copied.
 */
export function seedBinaryCache(opts: {
  parentEnv: Env;
  childEnv: Env;
  realHome: string;
  platform?: NodeJS.Platform;
}): string[] {
  const platform = opts.platform ?? process.platform;
  const exe = backendExe(platform);
  const owner = ownerConvexCacheDir({ ...opts, platform });
  const child = convexCacheDir(opts.childEnv, platform);
  const seeded: string[] = [];
  const binary = path.join("binaries", PINNED_LOCAL_BACKEND_VERSION);
  if (
    !fs.existsSync(path.join(child, binary, exe)) &&
    fs.existsSync(path.join(owner, binary, exe)) &&
    copyDirAtomically(path.join(owner, binary), path.join(child, binary))
  ) {
    seeded.push("backend binary");
  }
  if (
    dashboardVersion(child) !== PINNED_LOCAL_BACKEND_VERSION &&
    dashboardVersion(owner) === PINNED_LOCAL_BACKEND_VERSION &&
    copyDirAtomically(path.join(owner, "dashboard"), path.join(child, "dashboard"))
  ) {
    seeded.push("dashboard");
  }
  return seeded;
}

/** The one-time fetch instruction, shared by `vconvex` and `start`. */
export function pinnedBackendFetchHint(appPort: number, problems: string[]): string {
  return [
    `The pinned Convex local backend ${PINNED_LOCAL_BACKEND_VERSION} is not fully cached, and the wrapper never asks GitHub which version to use:`,
    ...problems.map((p) => `  - ${p}`),
    "Fetch it once. This downloads the pinned release assets from github.com (no api.github.com lookup) into the shared cache:",
    `  bun run validation:backend -- start --app-port ${appPort} --fetch-pinned-backend`,
    `  (or, with no backend running: bun run vconvex -- --app-port ${appPort} --fetch-pinned-backend dev --once)`,
  ].join("\n");
}

/**
 * Before any `dev`: refuse a backend saved at another version, seed the pinned binary from the
 * owner's cache, and fail with the one-time fetch instruction when anything is still missing,
 * unless `--fetch-pinned-backend` allows the CLI to download the pinned assets.
 */
export function preparePinnedBackend(
  inv: Pick<Invocation, "appPort" | "home" | "childEnv" | "fetchPinnedBackend">,
  say: (message: string) => void,
  owner: { parentEnv: Env; realHome: string; platform?: NodeJS.Platform } = { parentEnv: process.env, realHome: os.homedir() },
): void {
  const platform = owner.platform ?? process.platform;
  checkSavedBackendVersion(inv.home, inv.appPort);
  if (inv.childEnv.LOCALAPPDATA && platform === "win32") fs.mkdirSync(inv.childEnv.LOCALAPPDATA, { recursive: true });
  const seeded = seedBinaryCache({ ...owner, childEnv: inv.childEnv, platform });
  if (seeded.length > 0) {
    say(`[vconvex] seeded the ${seeded.join(" and ")} for ${PINNED_LOCAL_BACKEND_VERSION} from the owner's cache (read only)`);
  }
  const problems = pinnedBackendCacheProblems({ childEnv: inv.childEnv, platform });
  if (problems.length === 0) return;
  if (!inv.fetchPinnedBackend) throw new Error(pinnedBackendFetchHint(inv.appPort, problems));
  say(`[vconvex] --fetch-pinned-backend: the CLI downloads ${PINNED_LOCAL_BACKEND_VERSION} from github.com release assets (${problems.join("; ")})`);
}

export function formatTarget(inv: Invocation): string {
  return `[vconvex] app port ${inv.appPort} -> deployment ${inv.target.deployment} at ${inv.target.url} (site ${inv.target.siteUrl}); CLI home ${inv.target.home}`;
}

/**
 * Files `convex dev` rewrites as a side effect: the Cursor rules auto-update (no opt-out in
 * CLI 1.31) and the scaffolding written when a new anonymous deployment is created.
 */
export const CLI_TOUCHED_FILES = [".cursor/rules/convex_rules.mdc", "convex/README.md", "convex/tsconfig.json"];

/**
 * Codegen output every push rewrites with LF endings. A checkout made with `core.autocrlf=true`
 * before `.gitattributes` pinned these to LF has CRLF copies, and git keeps showing a size-changed
 * file as modified even though only the endings differ.
 */
export const CLI_GENERATED_DIR = "convex/_generated";

/**
 * `exact` entries go back byte for byte. `eol` entries go back only when the CLI's rewrite
 * differs in line endings alone, so real codegen changes stay.
 */
export type CliSnapshotEntry = { rel: string; mode: "exact" | "eol"; content: string | null };

export function takeCliSnapshot(repoRoot = REPO_ROOT): CliSnapshotEntry[] {
  const read = (rel: string) => {
    const full = path.join(repoRoot, rel);
    return fs.existsSync(full) ? fs.readFileSync(full).toString("base64") : null;
  };
  const generatedDir = path.join(repoRoot, CLI_GENERATED_DIR);
  const generated = fs.existsSync(generatedDir)
    ? fs
        .readdirSync(generatedDir, { withFileTypes: true })
        .filter((d) => d.isFile())
        .map((d) => `${CLI_GENERATED_DIR}/${d.name}`)
    : [];
  return [
    ...CLI_TOUCHED_FILES.map((rel) => ({ rel, mode: "exact" as const, content: read(rel) })),
    ...generated.map((rel) => ({ rel, mode: "eol" as const, content: read(rel) })),
  ];
}

/** A file a restore put back. `backup` holds the bytes it replaced, when there were any to lose. */
export type RevertedFile = { rel: string; backup?: string };

/** A fresh dir per restore, under the backend dir, for the bytes that restore overwrites. */
export function revertBackupDir(home: string, now = new Date()): string {
  return path.join(home, "reverted", now.toISOString().replace(/[:.]/g, "-"));
}

/**
 * Puts a snapshot back and lists what it reverted. Before an `exact` file is overwritten or
 * deleted, its current bytes go to `backupDir/<rel>`, so an edit made during a session isn't lost.
 * `eol` files only change line endings, so they need no copy.
 */
export function restoreCliSnapshot(
  snapshot: CliSnapshotEntry[],
  repoRoot = REPO_ROOT,
  opts: { backupDir?: string } = {},
): RevertedFile[] {
  const lf = (b: Buffer) => b.toString("utf8").replace(/\r\n/g, "\n");
  const backUp = (rel: string, bytes: Buffer | null): string | undefined => {
    if (!opts.backupDir || bytes === null) return undefined;
    const dest = path.join(opts.backupDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, bytes);
    return dest;
  };
  return snapshot.flatMap(({ rel, mode, content }): RevertedFile[] => {
    const full = path.join(repoRoot, rel);
    const now = fs.existsSync(full) ? fs.readFileSync(full) : null;
    const before = content === null ? null : Buffer.from(content, "base64");
    if (mode === "eol") {
      if (before === null || now === null || now.equals(before) || lf(now) !== lf(before)) return [];
      fs.writeFileSync(full, before);
      return [{ rel }];
    }
    if (before === null && now !== null) {
      const backup = backUp(rel, now);
      fs.rmSync(full);
      return [{ rel, backup }];
    }
    if (before !== null && (now === null || !now.equals(before))) {
      const backup = backUp(rel, now);
      fs.writeFileSync(full, before);
      return [{ rel, backup }];
    }
    return [];
  });
}

/** For the revert log line: each file, plus where the bytes it replaced were saved. */
export function formatReverted(reverted: RevertedFile[]): string {
  return reverted.map((r) => (r.backup ? `${r.rel} (replaced bytes saved to ${r.backup})` : r.rel)).join(", ");
}

/**
 * Snapshots the CLI-touched files. The returned function puts them back and lists what it
 * reverted, saving replaced bytes under `revertBackupDir(home)` when `home` is given.
 */
export function snapshotCliTouchedFiles(repoRoot = REPO_ROOT, home?: string): () => RevertedFile[] {
  const snapshot = takeCliSnapshot(repoRoot);
  return () => restoreCliSnapshot(snapshot, repoRoot, { backupDir: home ? revertBackupDir(home) : undefined });
}

async function backendAnswers(url: string): Promise<boolean> {
  try {
    return (await fetch(`${url}/instance_name`, { signal: AbortSignal.timeout(1000) })).ok;
  } catch {
    return false;
  }
}

export type RunOptions = {
  /** Written to the CLI's stdin (e.g. `env set NAME` values, so secrets stay out of argv). */
  input?: string;
  quiet?: boolean;
  /** Capture the CLI's stdout instead of inheriting it. */
  capture?: boolean;
  /** Kill the CLI (and its backend) after this long; the result code is then 124. */
  timeoutMs?: number;
};

export async function runConvex(argv: string[], opts: RunOptions = {}): Promise<number> {
  return (await runConvexCapture(argv, opts)).code;
}

/**
 * Runs the guarded CLI and resolves with its exit code (and stdout when `capture` is set). With
 * `--log-file`, the wrapper's own messages, refusals, and the CLI's output go to that file.
 */
export async function runConvexCapture(argv: string[], opts: RunOptions = {}): Promise<{ code: number; stdout: string }> {
  const { logFile } = splitArgs(argv);
  const logFd = logFile ? fs.openSync(logFile, "a") : null;
  const say = (message: string) => (logFd !== null ? fs.writeSync(logFd, `${message}\n`) : console.error(message));
  try {
    const inv = prepareInvocation({ argv, onRepoint: say });
    checkSavedDeploymentPorts(inv.home, inv.ports);
    if (!opts.quiet) say(formatTarget(inv));
    if (inv.printTarget) {
      console.log(JSON.stringify({ appPort: inv.appPort, ports: inv.ports, ...inv.target }, null, 2));
      return { code: 0, stdout: "" };
    }
    if (inv.cliArgs.find((a) => !a.startsWith("-")) === "dev" && (await backendAnswers(inv.target.url))) {
      throw new Error(
        `A backend is already running at ${inv.target.url}. Its \`validation:backend\` dev watcher already pushes convex/ changes; ` +
          `run \`bun run validation:backend -- stop --app-port ${inv.appPort}\` first to use \`vconvex dev\` directly.`,
      );
    }
    if (inv.cliArgs.find((a) => !a.startsWith("-")) === "dev") preparePinnedBackend(inv, say);
    const restore = snapshotCliTouchedFiles(REPO_ROOT, inv.home);
    fs.mkdirSync(backendTempDir(inv.home), { recursive: true });
    const out = logFd ?? "inherit";
    const stdin = opts.input !== undefined ? "pipe" : logFd !== null ? "ignore" : "inherit";
    const child: ChildProcess = spawn("node", [CONVEX_BIN, ...inv.cliArgs], {
      cwd: REPO_ROOT,
      env: inv.childEnv as NodeJS.ProcessEnv,
      stdio: [stdin, opts.capture ? "pipe" : out, out] as StdioOptions,
    });
    if (opts.input !== undefined) child.stdin!.end(opts.input);
    let stdout = "";
    child.stdout?.on("data", (chunk: Buffer) => (stdout += chunk.toString("utf8")));
    let timedOut = false;
    const timer =
      opts.timeoutMs === undefined
        ? undefined
        : setTimeout(() => {
            timedOut = true;
            if (child.pid !== undefined) killProcessTree(child.pid);
          }, opts.timeoutMs);
    const exitCode = await new Promise<number>((resolve, reject) => {
      child.on("error", reject);
      // "close" waits for captured stdout to drain; without capture there is nothing to drain.
      child.on(opts.capture ? "close" : "exit", (c: number | null, signal: NodeJS.Signals | null) =>
        resolve(c ?? (signal ? 1 : 0)),
      );
    });
    clearTimeout(timer);
    const code = timedOut ? 124 : exitCode;
    if (timedOut) say(`[vconvex] killed \`convex ${inv.cliArgs.join(" ")}\` after ${opts.timeoutMs}ms`);
    const reverted = restore();
    if (reverted.length > 0) say(`[vconvex] reverted CLI side-effect edits: ${formatReverted(reverted)}`);
    if (inv.cliArgs.find((a) => !a.startsWith("-")) === "dev") {
      const killed = killBackendExecutors(inv.home);
      if (killed.length > 0) say(`[vconvex] stopped orphaned backend node executor(s): ${killed.join(", ")}`);
    }
    return { code, stdout };
  } catch (err) {
    if (logFd !== null) say(err instanceof Error ? err.message : String(err));
    throw err;
  } finally {
    if (logFd !== null) fs.closeSync(logFd);
  }
}

if (import.meta.main) {
  // Ctrl+C reaches the CLI too; stay alive until it exits so the side-effect restore runs.
  process.on("SIGINT", () => {});
  try {
    const argv = process.argv.slice(2);
    if (splitArgs(argv).check) {
      const result = checkInvocation({ argv });
      console.log(formatCheck(result));
      process.exitCode = result.ok ? 0 : 1;
    } else {
      process.exitCode = await runConvex(argv);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
