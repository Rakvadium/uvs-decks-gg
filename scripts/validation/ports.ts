import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** App ports reserved for agent worktrees. 8090 is the human dev server. */
export const APP_PORT_MIN = 8100;
export const APP_PORT_MAX = 8199;
export const CONVEX_PORT_BASE = 3300;

export type BackendPorts = {
  app: number;
  /** Convex cloud (API) port: 3300 + 2*(P-8100). */
  cloud: number;
  /** Convex site (HTTP actions) port: cloud + 1. */
  site: number;
};

export function parseAppPort(raw: string | number | undefined): number {
  const value = typeof raw === "number" ? raw : Number(raw);
  if (raw === undefined || raw === "" || !Number.isInteger(value)) {
    throw new Error(`App port must be an integer in ${APP_PORT_MIN}-${APP_PORT_MAX}, got ${String(raw)}`);
  }
  if (value < APP_PORT_MIN || value > APP_PORT_MAX) {
    throw new Error(`App port ${value} is outside the validation range ${APP_PORT_MIN}-${APP_PORT_MAX}`);
  }
  return value;
}

export function portsFor(appPort: number): BackendPorts {
  const app = parseAppPort(appPort);
  const cloud = CONVEX_PORT_BASE + 2 * (app - APP_PORT_MIN);
  return { app, cloud, site: cloud + 1 };
}

export function loopbackUrl(port: number): string {
  return `http://127.0.0.1:${port}`;
}

/** `~/.uvs-validation` of the real (unwrapped) user. */
export function defaultValidationRoot(): string {
  return path.join(os.homedir(), ".uvs-validation");
}

export function backendDir(appPort: number, root = defaultValidationRoot()): string {
  return path.join(root, "backends", String(parseAppPort(appPort)));
}

/** Shared binary/dashboard cache, used as LOCALAPPDATA for wrapped CLI runs on Windows. */
export function sharedCacheDir(root = defaultValidationRoot()): string {
  return path.join(root, "cache");
}

// --- Port registry: ~/.uvs-validation/ports.json, keyed by worktree path ---

export type PortRegistry = Record<string, number>;

export function registryPath(root = defaultValidationRoot()): string {
  return path.join(root, "ports.json");
}

function worktreeKey(worktree: string): string {
  const resolved = path.resolve(worktree);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

export function readRegistry(root = defaultValidationRoot()): PortRegistry {
  const file = registryPath(root);
  if (!fs.existsSync(file)) return {};
  const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${file} is not a JSON object`);
  }
  const out: PortRegistry = {};
  for (const [key, value] of Object.entries(parsed)) out[key] = parseAppPort(value as number);
  return out;
}

export function lookupRegisteredPort(worktree: string, root = defaultValidationRoot()): number | null {
  return readRegistry(root)[worktreeKey(worktree)] ?? null;
}

function withRegistryLock<T>(root: string, fn: () => T): T {
  fs.mkdirSync(root, { recursive: true });
  const lock = `${registryPath(root)}.lock`;
  const deadline = Date.now() + 10_000;
  for (;;) {
    try {
      fs.closeSync(fs.openSync(lock, "wx"));
      break;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      const age = Date.now() - fs.statSync(lock).mtimeMs;
      if (age > 30_000) fs.rmSync(lock, { force: true });
      else if (Date.now() > deadline) throw new Error(`Timed out waiting for ${lock}`);
      else Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmSync(lock, { force: true });
  }
}

/**
 * Claim an app port for a worktree. `"auto"` reuses the worktree's existing claim or takes the
 * lowest free port. A specific port fails if another worktree already holds it.
 */
export function claimPort(worktree: string, requested: number | "auto", root = defaultValidationRoot()): number {
  return withRegistryLock(root, () => {
    const registry = readRegistry(root);
    const key = worktreeKey(worktree);
    const owner = (port: number) => Object.entries(registry).find(([k, p]) => p === port && k !== key)?.[0];
    let port: number;
    if (requested === "auto") {
      if (registry[key] !== undefined) return registry[key];
      const taken = new Set(Object.values(registry));
      const free = Array.from({ length: APP_PORT_MAX - APP_PORT_MIN + 1 }, (_, i) => APP_PORT_MIN + i).find(
        (p) => !taken.has(p),
      );
      if (free === undefined) throw new Error("No free validation app ports left in the registry");
      port = free;
    } else {
      port = parseAppPort(requested);
      const holder = owner(port);
      if (holder) throw new Error(`App port ${port} is already claimed by ${holder}`);
    }
    registry[key] = port;
    fs.writeFileSync(registryPath(root), `${JSON.stringify(registry, null, 2)}\n`);
    return port;
  });
}

/** `--app-port P` beats `UVS_APP_PORT`, which beats the registry entry for this worktree. */
export function resolveAppPort(opts: {
  flag?: string;
  env?: Record<string, string | undefined>;
  worktree?: string;
  root?: string;
}): number {
  if (opts.flag !== undefined) return parseAppPort(opts.flag);
  const fromEnv = opts.env?.UVS_APP_PORT;
  if (fromEnv) return parseAppPort(fromEnv);
  const registered = lookupRegisteredPort(opts.worktree ?? process.cwd(), opts.root);
  if (registered !== null) return registered;
  throw new Error(
    `No validation app port. Pass --app-port <${APP_PORT_MIN}-${APP_PORT_MAX}>, set UVS_APP_PORT, or claim one in ${registryPath(opts.root)}.`,
  );
}
