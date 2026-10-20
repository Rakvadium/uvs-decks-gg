/**
 * Per-port validation backend lifecycle:
 *
 *   bun run validation:backend -- start  --app-port P [--timeout 60] [--repoint-env-local] [--fetch-pinned-backend]
 *   bun run validation:backend -- stop   --app-port P
 *   bun run validation:backend -- status [--app-port P]
 *
 * `start` sets the generated backend env (env.ts), pushes this worktree's `convex/` with
 * `vconvex dev --once`, then keeps a `vconvex dev` watcher running in the background (PID file)
 * that pushes later changes. See `start` for the readiness checks.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import {
  REPO_ROOT,
  formatReverted,
  formatTarget,
  killBackendExecutors,
  killBackendProcesses,
  killProcessTree,
  prepareInvocation,
  preparePinnedBackend,
  revertBackupDir,
  runConvex,
  restoreCliSnapshot,
  runConvexCapture,
  takeCliSnapshot,
  type CliSnapshotEntry,
} from "./convex";
import { applyBackendEnv } from "./env";
import { backendDir, defaultValidationRoot, loopbackUrl, parseAppPort, portsFor, type BackendPorts } from "./ports";

type PidRecord = { pid: number; startedAt: string; ports: BackendPorts };

export type BackendStatus = {
  appPort: number;
  ports: BackendPorts;
  url: string;
  pid: number | null;
  pidAlive: boolean;
  version: string | null;
  instanceName: string | null;
};

const pidFile = (appPort: number, root?: string) => path.join(backendDir(appPort, root), "backend.pid");
const logFile = (appPort: number, root?: string) => path.join(backendDir(appPort, root), "backend.log");
const snapshotFile = (appPort: number, root?: string) => path.join(backendDir(appPort, root), "cli-touched-files.json");

type SavedSnapshot = { repoRoot: string; entries: CliSnapshotEntry[] };

/**
 * `start` saves the CLI-touched files before its first CLI run. The watcher rewrites the Cursor
 * rules after `start` has restored them, and `stop` kills it before its own restore can run, so
 * `stop` restores from this copy.
 */
function saveSnapshot(appPort: number): void {
  const saved: SavedSnapshot = { repoRoot: REPO_ROOT, entries: takeCliSnapshot() };
  fs.writeFileSync(snapshotFile(appPort), JSON.stringify(saved));
}

/**
 * `watcherRunning` skips `convex/_generated/*`: the watcher sees the rewrite, pushes again and
 * writes its own copy back, so those go back only once it is stopped. Bytes it overwrites are
 * saved under `<backend dir>/reverted/<time>/` first.
 */
function restoreSavedSnapshot(appPort: number, opts: { discard: boolean; watcherRunning?: boolean }): void {
  const file = snapshotFile(appPort);
  if (!fs.existsSync(file)) return;
  const saved = JSON.parse(fs.readFileSync(file, "utf8")) as SavedSnapshot;
  const entries = opts.watcherRunning ? saved.entries.filter((e) => e.mode === "exact") : saved.entries;
  const reverted = restoreCliSnapshot(entries, saved.repoRoot, { backupDir: revertBackupDir(backendDir(appPort)) });
  if (opts.discard) fs.rmSync(file, { force: true });
  if (reverted.length > 0) console.error(`[validation] reverted CLI side-effect edits: ${formatReverted(reverted)}`);
}

function logSize(appPort: number): number {
  const file = logFile(appPort);
  return fs.existsSync(file) ? fs.statSync(file).size : 0;
}

function logSince(appPort: number, offset: number): string {
  const file = logFile(appPort);
  if (!fs.existsSync(file)) return "";
  return fs.readFileSync(file).subarray(offset).toString("utf8");
}

/** The watcher's first push is done; its one Cursor rules check runs alongside that push. */
const WATCHER_PUSHED = "Convex functions ready!";
const WATCHER_SETTLE_MS = 20_000;

function readPid(appPort: number): PidRecord | null {
  const file = pidFile(appPort);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as PidRecord) : null;
}

export function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === "EPERM";
  }
}

function canConnect(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(500);
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("timeout", () => (socket.destroy(), resolve(false)));
    socket.once("error", () => resolve(false));
  });
}

function canListen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

export async function isPortFree(port: number): Promise<boolean> {
  return !(await canConnect(port)) && (await canListen(port));
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(1000) });
    return resp.ok ? await resp.text() : null;
  } catch {
    return null;
  }
}

export async function status(appPort: number): Promise<BackendStatus> {
  const ports = portsFor(appPort);
  const url = loopbackUrl(ports.cloud);
  const record = readPid(appPort);
  return {
    appPort,
    ports,
    url,
    pid: record?.pid ?? null,
    pidAlive: record ? isPidAlive(record.pid) : false,
    version: await fetchText(`${url}/version`),
    instanceName: await fetchText(`${url}/instance_name`),
  };
}

function logTail(appPort: number, lines = 30): string {
  const file = logFile(appPort);
  if (!fs.existsSync(file)) return "(no log)";
  return fs.readFileSync(file, "utf8").split(/\r?\n/).slice(-lines).join("\n");
}

/**
 * Starts `bun convex.ts <args>` fully detached and returns its PID. On Windows, a child spawned
 * from bun inherits its inheritable handles, so the detached watcher kept the caller's stdout
 * pipe open and `start` looked hung to anything waiting for EOF. Start-Process goes through
 * ShellExecute, which inherits no handles; the wrapper itself writes CLI output to `--log-file`.
 */
function spawnDetached(args: string[]): number {
  const script = path.join(REPO_ROOT, "scripts", "validation", "convex.ts");
  if (process.platform === "win32") {
    const psQuote = (s: string) => `'${s.replace(/'/g, "''")}'`;
    const argList = [script, ...args].map((a) => `"${a}"`).join(" ");
    const command = `(Start-Process -FilePath ${psQuote(process.execPath)} -ArgumentList ${psQuote(argList)} -WorkingDirectory ${psQuote(REPO_ROOT)} -WindowStyle Hidden -PassThru).Id`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8" });
    const pid = Number(result.stdout.trim());
    if (result.status !== 0 || !Number.isInteger(pid) || pid <= 0) {
      throw new Error(`Failed to start vconvex dev: ${result.stderr || result.stdout}`);
    }
    return pid;
  }
  const child = spawn(process.execPath, [script, ...args], { cwd: REPO_ROOT, detached: true, stdio: "ignore" });
  if (child.pid === undefined) throw new Error("Failed to spawn vconvex dev");
  child.unref();
  return child.pid;
}

async function waitFor(check: () => Promise<boolean> | boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

/** Readiness probe pushed with convex/ (convex/lib/validationBackend.ts). */
export const STATUS_FUNCTION = "lib/validationBackend:status";

/** Parses `convex run lib/validationBackend:status` output. null = not answered (yet). */
export function parseStatusOutput(stdout: string): boolean | null {
  const m = /"?validationBackend"?\s*:\s*(true|false)/.exec(stdout);
  return m ? m[1] === "true" : null;
}

async function stopWatcher(appPort: number, pid: number | null): Promise<void> {
  const ports = portsFor(appPort);
  if (pid !== null && isPidAlive(pid)) {
    killProcessTree(pid);
    await waitFor(() => !isPidAlive(pid), 10_000);
  }
  const strays = killBackendProcesses(backendDir(appPort));
  if (strays.length > 0) console.error(`[validation] stopped leftover port ${appPort} backend processes: ${strays.join(", ")}`);
  killBackendExecutors(backendDir(appPort));
  const freed = await waitFor(async () => (await isPortFree(ports.cloud)) && (await isPortFree(ports.site)), 15_000);
  if (!freed) throw new Error(`Ports ${ports.cloud}/${ports.site} are still in use after stopping the port ${appPort} backend`);
}

/**
 * 1. Run a dev watcher just long enough to bring the backend up and set its env (a fresh
 *    backend's first push fails until the R2 placeholders exist).
 * 2. Stop it and push with `vconvex dev --once`, whose exit code decides whether convex/ pushed.
 * 3. Start the long-running watcher; ready once `/version` answers and the pushed readiness query
 *    says it is a validation backend. Every wait is bounded by `timeoutSec` (default 60).
 */
export async function start(
  appPort: number,
  opts: { timeoutSec?: number; repointEnvLocal?: boolean; fetchPinnedBackend?: boolean } = {},
): Promise<BackendStatus> {
  const ports = portsFor(appPort);
  const existing = readPid(appPort);
  if (existing && isPidAlive(existing.pid)) {
    const current = await status(appPort);
    if (current.version !== null) {
      console.error(`[validation] port ${appPort} backend already running (pid ${existing.pid})`);
      return current;
    }
    throw new Error(`pid ${existing.pid} for port ${appPort} is alive but ${current.url}/version does not answer; run stop first`);
  }
  for (const port of [ports.cloud, ports.site]) {
    if (!(await isPortFree(port))) throw new Error(`Port ${port} is already in use; the port ${appPort} backend cannot start`);
  }

  const base = [
    "--app-port",
    String(appPort),
    ...(opts.repointEnvLocal ? ["--repoint-env-local"] : []),
    ...(opts.fetchPinnedBackend ? ["--fetch-pinned-backend"] : []),
  ];
  // Run the guard here too, so a refusal fails `start` loudly instead of only in the log.
  const inv = prepareInvocation({ argv: [...base, "dev"] });
  console.error(formatTarget(inv));
  fs.mkdirSync(inv.home, { recursive: true });
  // The checks every wrapped `dev` runs, up front, so a missing pinned binary or a backend saved at
  // another version fails `start` with the way out instead of only in the detached watcher's log.
  preparePinnedBackend(inv, (message) => console.error(message));

  // No backend is live here, so a snapshot left by a `start` that was killed holds the files as
  // they were before that run. Put it back before taking a new one, or the new baseline would
  // record whatever the crashed run left behind.
  if (fs.existsSync(snapshotFile(appPort))) {
    console.error(`[validation] restoring the snapshot an unfinished port ${appPort} start left behind`);
    restoreSavedSnapshot(appPort, { discard: true });
  }
  saveSnapshot(appPort);
  const log = logFile(appPort);
  const timeoutMs = (opts.timeoutSec ?? 60) * 1000;
  const watcherArgs = [...base, "dev", "--tail-logs", "disable", "--log-file", log];
  let pid: number | null = null;
  const fail = async (what: string): Promise<never> => {
    if (pid !== null) await stopWatcher(appPort, pid).catch(() => {});
    fs.rmSync(pidFile(appPort), { force: true });
    restoreSavedSnapshot(appPort, { discard: true });
    throw new Error(`Port ${appPort} backend ${what}.\n--- log tail (${log}) ---\n${logTail(appPort)}`);
  };
  const versionUp = async () => (await fetchText(`${inv.target.url}/version`)) !== null;

  const recordPid = (p: number) =>
    fs.writeFileSync(pidFile(appPort), JSON.stringify({ pid: p, startedAt: new Date().toISOString(), ports } satisfies PidRecord, null, 2));

  // 1. Backend up, env set. The PID is recorded at once, so `stop` works even if `start` is killed here.
  pid = spawnDetached(watcherArgs);
  recordPid(pid);
  const up = await waitFor(async () => !isPidAlive(pid!) || (await versionUp()), timeoutMs);
  if (!up || !isPidAlive(pid)) await fail(up ? "exited during startup" : `did not answer /version within ${timeoutMs / 1000}s`);
  try {
    await applyBackendEnv(appPort);
  } catch (err) {
    await fail(`could not set its env: ${(err as Error).message}`);
  }
  await stopWatcher(appPort, pid);
  fs.rmSync(pidFile(appPort), { force: true });
  pid = null;

  // 2. Authoritative push.
  console.error(`[validation] pushing convex/ to the port ${appPort} backend (vconvex dev --once)`);
  const pushCode = await runConvex([...base, "dev", "--once", "--tail-logs", "disable", "--log-file", log], {
    quiet: true,
    timeoutMs,
  });
  if (pushCode !== 0) await fail(pushCode === 124 ? `push timed out after ${timeoutMs / 1000}s` : `push failed (vconvex dev --once exited ${pushCode})`);

  // 3. Long-running watcher.
  const watcherLogStart = logSize(appPort);
  pid = spawnDetached(watcherArgs);
  recordPid(pid);
  console.error(`[validation] started vconvex dev watcher for port ${appPort} (pid ${pid}), log ${log}`);
  let probe: boolean | null = null;
  const ready = await waitFor(async () => {
    if (!isPidAlive(pid!)) return true;
    if (!(await versionUp())) return false;
    const { code, stdout } = await runConvexCapture(["--app-port", String(appPort), "run", STATUS_FUNCTION], {
      capture: true,
      quiet: true,
      timeoutMs: 20_000,
    });
    probe = code === 0 ? parseStatusOutput(stdout) : null;
    return probe !== null;
  }, timeoutMs);
  if (!isPidAlive(pid)) await fail("watcher exited before the backend was ready");
  if (!ready) await fail(`was not ready within ${timeoutMs / 1000}s (/version or \`run ${STATUS_FUNCTION}\` did not answer)`);
  if (probe === false) {
    await fail("answered, but isValidationBackend() is false there (UVS_VALIDATION_BACKEND or a loopback CONVEX_CLOUD_URL is missing)");
  }

  // Restore once the watcher's own push (and the Cursor rules update beside it) has run; `stop`
  // restores again in case anything lands later.
  const settled = await waitFor(() => logSince(appPort, watcherLogStart).includes(WATCHER_PUSHED), Math.min(timeoutMs, WATCHER_SETTLE_MS));
  if (!settled) console.error(`[validation] the watcher has not logged "${WATCHER_PUSHED}" yet; restoring CLI side-effect edits anyway`);
  restoreSavedSnapshot(appPort, { discard: false, watcherRunning: true });
  console.error(`[validation] port ${appPort} backend is up, convex/ is pushed, and isValidationBackend() is true`);
  return status(appPort);
}

export async function stop(appPort: number): Promise<void> {
  const record = readPid(appPort);
  await stopWatcher(appPort, record?.pid ?? null);
  fs.rmSync(pidFile(appPort), { force: true });
  restoreSavedSnapshot(appPort, { discard: true });
  console.error(`[validation] port ${appPort} backend stopped`);
}

function knownPorts(): number[] {
  const dir = path.join(defaultValidationRoot(), "backends");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => /^\d+$/.test(d))
    .map(Number)
    .sort((a, b) => a - b);
}

async function main(argv: string[]) {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const command = args[0];
  const flag = (name: string) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
  };
  const portRaw = flag("--app-port") ?? process.env.UVS_APP_PORT;
  switch (command) {
    case "start": {
      const result = await start(parseAppPort(portRaw), {
        repointEnvLocal: args.includes("--repoint-env-local"),
        fetchPinnedBackend: args.includes("--fetch-pinned-backend"),
        timeoutSec: flag("--timeout") ? Number(flag("--timeout")) : undefined,
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "stop":
      await stop(parseAppPort(portRaw));
      return;
    case "status": {
      const targets = portRaw ? [parseAppPort(portRaw)] : knownPorts();
      console.log(JSON.stringify(await Promise.all(targets.map(status)), null, 2));
      return;
    }
    default:
      throw new Error("Usage: backend.ts start|stop|status --app-port P");
  }
}

if (import.meta.main) {
  try {
    await main(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
