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
 * another backend), and `--log-file <path>` (append all output there; backend.ts uses it for the
 * detached dev watcher).
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
  convexArgs: string[];
} {
  const rest = argv[0] === "--" ? argv.slice(1) : [...argv];
  let appPortFlag: string | undefined;
  let logFile: string | undefined;
  let printTarget = false;
  let repointEnvLocal = false;
  let check = false;
  const convexArgs: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--app-port") appPortFlag = rest[++i];
    else if (arg.startsWith("--app-port=")) appPortFlag = arg.slice("--app-port=".length);
    else if (arg === "--print-target") printTarget = true;
    else if (arg === "--repoint-env-local") repointEnvLocal = true;
    else if (arg === "--check") check = true;
    else if (arg === "--log-file") logFile = rest[++i];
    else convexArgs.push(arg);
  }
  return { appPortFlag, printTarget, logFile, repointEnvLocal, check, convexArgs };
}

export function withLocalPorts(args: string[], ports: BackendPorts): string[] {
  const devIndex = args.findIndex((a) => !a.startsWith("-"));
  if (devIndex === -1 || args[devIndex] !== "dev") return args;
  return [
    ...args.slice(0, devIndex + 1),
    "--local",
    "--local-cloud-port",
    String(ports.cloud),
    "--local-site-port",
    String(ports.site),
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
  const guardInput = (skipEnvLocalPort: boolean): GuardInput => {
    const files = readCliEnvFiles(cwd);
    return {
      args: split.check && split.convexArgs.length === 0 ? null : split.convexArgs,
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
  return { ...split, cwd, root, appPort, ports, parentEnv, childEnv, guardInput };
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
  const { cwd, root, appPort, ports, childEnv, guardInput, printTarget, logFile, repointEnvLocal: repoint, convexArgs } =
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
    cliArgs: withLocalPorts(convexArgs, ports),
    printTarget,
    logFile,
    target: {
      deployment: ANONYMOUS_DEPLOYMENT,
      url: loopbackUrl(ports.cloud),
      siteUrl: loopbackUrl(ports.site),
      home,
    },
  };
}

/** The CLI saves the ports a deployment was created with; refuse if they drifted from ports.ts. */
export function checkSavedDeploymentPorts(home: string, ports: BackendPorts): void {
  const name = ANONYMOUS_DEPLOYMENT.slice("anonymous:".length);
  const config = path.join(home, ".convex", "anonymous-convex-backend-state", name, "config.json");
  if (!fs.existsSync(config)) return;
  const saved = JSON.parse(fs.readFileSync(config, "utf8")) as { ports?: { cloud?: number; site?: number } };
  if (saved.ports && (saved.ports.cloud !== ports.cloud || saved.ports.site !== ports.site)) {
    throw new GuardError([
      `${config} uses ports ${saved.ports.cloud}/${saved.ports.site}, expected ${ports.cloud}/${ports.site}.`,
    ]);
  }
}

/** Seeds the wrapped CLI's binary cache from the owner's cache (read only) to skip a 130MB download. */
export function seedBinaryCache(opts: {
  parentEnv: Env;
  childEnv: Env;
  realHome: string;
  platform?: NodeJS.Platform;
}): boolean {
  const platform = opts.platform ?? process.platform;
  const ownerCache =
    platform === "win32"
      ? path.join(opts.parentEnv.LOCALAPPDATA ?? path.join(opts.realHome, "AppData", "Local"), "convex", "binaries")
      : path.join(opts.realHome, ".cache", "convex", "binaries");
  const childCache =
    platform === "win32"
      ? path.join(opts.childEnv.LOCALAPPDATA!, "convex", "binaries")
      : path.join(opts.childEnv.HOME!, ".cache", "convex", "binaries");
  const exe = platform === "win32" ? "convex-local-backend.exe" : "convex-local-backend";
  const versions = (dir: string) =>
    fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, exe))) : [];
  if (versions(childCache).length > 0) return false;
  const newest = versions(ownerCache).sort().at(-1);
  if (!newest) return false;
  const partial = path.join(path.dirname(childCache), `.binaries-partial-${process.pid}`);
  fs.mkdirSync(childCache, { recursive: true });
  try {
    fs.cpSync(path.join(ownerCache, newest), partial, { recursive: true });
    fs.renameSync(partial, path.join(childCache, newest));
    return true;
  } catch {
    // Another run seeded it first, or the copy failed; the CLI downloads the binary itself then.
    return false;
  } finally {
    fs.rmSync(partial, { recursive: true, force: true });
  }
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

/** Puts a snapshot back and lists what it reverted. */
export function restoreCliSnapshot(snapshot: CliSnapshotEntry[], repoRoot = REPO_ROOT): string[] {
  const lf = (b: Buffer) => b.toString("utf8").replace(/\r\n/g, "\n");
  return snapshot.flatMap(({ rel, mode, content }) => {
    const full = path.join(repoRoot, rel);
    const now = fs.existsSync(full) ? fs.readFileSync(full) : null;
    const before = content === null ? null : Buffer.from(content, "base64");
    if (mode === "eol") {
      if (before === null || now === null || now.equals(before) || lf(now) !== lf(before)) return [];
      fs.writeFileSync(full, before);
      return [rel];
    }
    if (before === null && now !== null) {
      fs.rmSync(full);
      return [rel];
    }
    if (before !== null && (now === null || !now.equals(before))) {
      fs.writeFileSync(full, before);
      return [rel];
    }
    return [];
  });
}

/** Snapshots the CLI-touched files; the returned function puts them back and lists what it reverted. */
export function snapshotCliTouchedFiles(repoRoot = REPO_ROOT): () => string[] {
  const snapshot = takeCliSnapshot(repoRoot);
  return () => restoreCliSnapshot(snapshot, repoRoot);
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
    const restore = snapshotCliTouchedFiles();
    fs.mkdirSync(backendTempDir(inv.home), { recursive: true });
    if (inv.childEnv.LOCALAPPDATA && process.platform === "win32") fs.mkdirSync(inv.childEnv.LOCALAPPDATA, { recursive: true });
    if (seedBinaryCache({ parentEnv: process.env, childEnv: inv.childEnv, realHome: os.homedir() })) {
      say("[vconvex] seeded the backend binary cache from the owner's cache (read only)");
    }
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
    if (reverted.length > 0) say(`[vconvex] reverted CLI side-effect edits: ${reverted.join(", ")}`);
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
