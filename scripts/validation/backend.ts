/**
 * Per-port validation backend lifecycle:
 *
 *   bun run validation:backend -- start  --app-port P [--no-env] [--timeout 300]
 *   bun run validation:backend -- stop   --app-port P
 *   bun run validation:backend -- status [--app-port P]
 *
 * `start` runs `vconvex dev` (guarded) in the background, which starts the local backend and
 * pushes this worktree's `convex/`. It records the PID, waits for `/version`, sets the generated
 * backend env (env.ts; the watcher retries a push that failed on missing env), then waits for a
 * successful push. `--no-env` skips the env step for a backend whose env is already set.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { REPO_ROOT, formatTarget, killBackendExecutors, prepareInvocation, snapshotCliTouchedFiles } from "./convex";
import { applyBackendEnv } from "./env";
import { backendDir, defaultValidationRoot, loopbackUrl, parseAppPort, portsFor, type BackendPorts } from "./ports";

const READY_MARKER = "Convex functions ready!";

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

function readPid(appPort: number): PidRecord | null {
  const file = pidFile(appPort);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as PidRecord) : null;
}

export function isPidAlive(pid: number): boolean {
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

function killTree(pid: number) {
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

export async function start(appPort: number, opts: { env?: boolean; timeoutSec?: number } = {}): Promise<BackendStatus> {
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

  // Run the guard here too, so a refusal fails `start` loudly instead of only in the log.
  const args = ["--app-port", String(appPort), "dev", "--tail-logs", "disable"];
  const inv = prepareInvocation({ argv: args });
  console.error(formatTarget(inv));

  fs.mkdirSync(inv.home, { recursive: true });
  const restore = snapshotCliTouchedFiles();
  const log = logFile(appPort);
  fs.appendFileSync(log, "");
  const offset = fs.statSync(log).size;
  const pid = spawnDetached([...args, "--log-file", log]);
  const record: PidRecord = { pid, startedAt: new Date().toISOString(), ports };
  fs.writeFileSync(pidFile(appPort), JSON.stringify(record, null, 2));
  console.error(`[validation] started vconvex dev for port ${appPort} (pid ${pid}), log ${log}`);

  const timeoutMs = (opts.timeoutSec ?? 300) * 1000;
  const fail = (what: string): never => {
    if (isPidAlive(pid)) killTree(pid);
    killBackendExecutors(inv.home);
    fs.rmSync(pidFile(appPort), { force: true });
    restore();
    throw new Error(`Port ${appPort} backend ${what}.\n--- log tail ---\n${logTail(appPort)}`);
  };
  const readSinceStart = () => fs.readFileSync(log).subarray(offset).toString("utf8");

  // 1. Backend process up. 2. Env set: on a fresh backend the first push fails on missing R2
  // env, and the dev watcher retries on env changes. 3. A push succeeded.
  const up = await waitFor(async () => !isPidAlive(pid) || (await fetchText(`${inv.target.url}/version`)) !== null, timeoutMs);
  if (!up || !isPidAlive(pid)) fail(up ? "exited during startup" : "did not answer /version");
  if (opts.env !== false) await applyBackendEnv(appPort);
  const pushed = await waitFor(() => !isPidAlive(pid) || readSinceStart().includes(READY_MARKER), timeoutMs);
  if (!pushed || !isPidAlive(pid)) fail(pushed ? "exited before the first push finished" : "did not finish a push in time");

  const reverted = restore();
  if (reverted.length > 0) console.error(`[validation] reverted CLI side-effect edits: ${reverted.join(", ")}`);
  console.error(`[validation] port ${appPort} backend is up and convex/ is pushed`);
  return status(appPort);
}

export async function stop(appPort: number): Promise<void> {
  const ports = portsFor(appPort);
  const record = readPid(appPort);
  if (record && isPidAlive(record.pid)) {
    killTree(record.pid);
    await waitFor(() => !isPidAlive(record.pid), 10_000);
  }
  killBackendExecutors(backendDir(appPort));
  fs.rmSync(pidFile(appPort), { force: true });
  const freed = await waitFor(async () => (await isPortFree(ports.cloud)) && (await isPortFree(ports.site)), 15_000);
  if (!freed) throw new Error(`Ports ${ports.cloud}/${ports.site} are still in use after stopping the port ${appPort} backend`);
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
        env: !args.includes("--no-env"),
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
