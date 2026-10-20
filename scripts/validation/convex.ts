/**
 * Guarded Convex CLI wrapper: `bun run vconvex -- [--app-port P] <convex args>`.
 *
 * Runs the CLI in anonymous agent mode with USERPROFILE/HOME pointed at
 * ~/.uvs-validation/backends/<P>/, so the owner's Convex login is invisible, and pins the
 * backend to the fixed ports from ports.ts. guard.ts refuses anything that could reach a
 * cloud deployment.
 *
 * Wrapper flags: `--app-port P` (else UVS_APP_PORT, else the port registry), `--print-target`
 * (run the guard, print the target, exit without calling the CLI), and `--log-file <path>`
 * (append all output there; backend.ts uses it for the detached dev watcher).
 */
import { spawn, spawnSync, type ChildProcess, type StdioOptions } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ANONYMOUS_DEPLOYMENT,
  GuardError,
  assertGuard,
  readCliEnvFiles,
  type Env,
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

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CONVEX_BIN = path.join(REPO_ROOT, "node_modules", "convex", "bin", "main.js");

/** Removed from the wrapped env; the guard separately refuses the dangerous ones in the caller's env. */
const STRIPPED_ENV = [
  "CONVEX_DEPLOYMENT",
  "CONVEX_DEPLOY_KEY",
  "CONVEX_OVERRIDE_ACCESS_TOKEN",
  "CONVEX_PROVISION_HOST",
  "CONVEX_SELF_HOSTED_URL",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
  "CONVEX_ALLOW_ANONYMOUS",
  "UVS_APP_PORT",
];

function deleteKey(env: Env, key: string, platform: NodeJS.Platform) {
  for (const existing of Object.keys(env)) {
    if (platform === "win32" ? existing.toUpperCase() === key.toUpperCase() : existing === key) delete env[existing];
  }
}

function setKey(env: Env, key: string, value: string, platform: NodeJS.Platform) {
  deleteKey(env, key, platform);
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
  for (const key of STRIPPED_ENV) deleteKey(env, key, platform);
  const home = backendDir(opts.appPort, opts.root);
  setKey(env, "CONVEX_AGENT_MODE", "anonymous", platform);
  setKey(env, "CONVEX_DEPLOYMENT", ANONYMOUS_DEPLOYMENT, platform);
  setKey(env, "USERPROFILE", home, platform);
  setKey(env, "HOME", home, platform);
  // A per-backend temp dir marks the backend's node executor so orphans can be found and killed.
  for (const key of platform === "win32" ? ["TEMP", "TMP"] : ["TMPDIR"]) setKey(env, key, backendTempDir(home), platform);
  if (platform === "win32") setKey(env, "LOCALAPPDATA", sharedCacheDir(opts.root), platform);
  return env;
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
  convexArgs: string[];
} {
  const rest = argv[0] === "--" ? argv.slice(1) : [...argv];
  let appPortFlag: string | undefined;
  let logFile: string | undefined;
  let printTarget = false;
  const convexArgs: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--app-port") appPortFlag = rest[++i];
    else if (arg.startsWith("--app-port=")) appPortFlag = arg.slice("--app-port=".length);
    else if (arg === "--print-target") printTarget = true;
    else if (arg === "--log-file") logFile = rest[++i];
    else convexArgs.push(arg);
  }
  return { appPortFlag, printTarget, logFile, convexArgs };
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

/** Resolves the port, builds the wrapped env, and runs the guard. Throws GuardError on refusal. */
export function prepareInvocation(opts: {
  argv: string[];
  parentEnv?: Env;
  cwd?: string;
  root?: string;
  realHome?: string;
  platform?: NodeJS.Platform;
}): Invocation {
  const parentEnv = opts.parentEnv ?? process.env;
  const cwd = opts.cwd ?? REPO_ROOT;
  const root = opts.root ?? defaultValidationRoot();
  const platform = opts.platform ?? process.platform;
  const { appPortFlag, printTarget, logFile, convexArgs } = splitArgs(opts.argv);
  const appPort = resolveAppPort({ flag: appPortFlag, env: parentEnv, worktree: cwd, root });
  const ports = portsFor(appPort);
  const childEnv = buildChildEnv({ parentEnv, appPort, root, platform });
  assertGuard({
    args: convexArgs,
    sources: [{ name: "the caller's environment", env: parentEnv }, ...readCliEnvFiles(cwd)],
    childEnv,
    appPort,
    root,
    realHome: opts.realHome ?? os.homedir(),
    platform,
  });
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

/** Snapshots CLI_TOUCHED_FILES; the returned function puts them back and lists what it reverted. */
export function snapshotCliTouchedFiles(repoRoot = REPO_ROOT): () => string[] {
  const before = CLI_TOUCHED_FILES.map((rel) => {
    const full = path.join(repoRoot, rel);
    return { rel, full, content: fs.existsSync(full) ? fs.readFileSync(full) : null };
  });
  return () =>
    before.flatMap(({ rel, full, content }) => {
      const now = fs.existsSync(full) ? fs.readFileSync(full) : null;
      if (content === null && now !== null) {
        fs.rmSync(full);
        return [rel];
      }
      if (content !== null && (now === null || !now.equals(content))) {
        fs.writeFileSync(full, content);
        return [rel];
      }
      return [];
    });
}

async function backendAnswers(url: string): Promise<boolean> {
  try {
    return (await fetch(`${url}/instance_name`, { signal: AbortSignal.timeout(1000) })).ok;
  } catch {
    return false;
  }
}

/**
 * Runs the guarded CLI. Resolves with the exit code. `input` is written to the CLI's stdin.
 * With `--log-file`, the wrapper's own messages and the CLI's output are appended to that file.
 */
export async function runConvex(argv: string[], opts: { input?: string; quiet?: boolean } = {}): Promise<number> {
  const inv = prepareInvocation({ argv });
  const logFd = inv.logFile ? fs.openSync(inv.logFile, "a") : null;
  const say = (message: string) => (logFd !== null ? fs.writeSync(logFd, `${message}\n`) : console.error(message));
  try {
    checkSavedDeploymentPorts(inv.home, inv.ports);
    if (!opts.quiet) say(formatTarget(inv));
    if (inv.printTarget) {
      console.log(JSON.stringify({ appPort: inv.appPort, ports: inv.ports, ...inv.target }, null, 2));
      return 0;
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
      stdio: [stdin, out, out] as StdioOptions,
    });
    if (opts.input !== undefined) child.stdin!.end(opts.input);
    const code = await new Promise<number>((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (exitCode: number | null, signal: NodeJS.Signals | null) => resolve(exitCode ?? (signal ? 1 : 0)));
    });
    const reverted = restore();
    if (reverted.length > 0) say(`[vconvex] reverted CLI side-effect edits: ${reverted.join(", ")}`);
    if (inv.cliArgs.find((a) => !a.startsWith("-")) === "dev") {
      const killed = killBackendExecutors(inv.home);
      if (killed.length > 0) say(`[vconvex] stopped orphaned backend node executor(s): ${killed.join(", ")}`);
    }
    return code;
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
    process.exitCode = await runConvex(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
