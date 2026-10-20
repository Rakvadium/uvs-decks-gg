import { randomBytes } from "node:crypto";
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
  // Retries a read that Windows reports busy while a claim is replacing the file.
  const text = readText(file);
  if (text === null) return {};
  const parsed: unknown = JSON.parse(text);
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

const sleepMs = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * Runs a rename or delete, retrying for up to 5s while Windows reports the file busy (EPERM,
 * EACCES, EBUSY: another process has it open, since readers and lock waiters don't lock).
 */
function retryWhileBusy(op: () => void): void {
  const deadline = Date.now() + 5_000;
  for (;;) {
    try {
      op();
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code ?? "";
      if (!["EPERM", "EACCES", "EBUSY"].includes(code) || Date.now() > deadline) throw err;
      sleepMs(2);
    }
  }
}

/** What a registry lock file holds: who took it, so a waiter can tell a dead owner from a live one. */
export type LockOwner = { pid: number; host: string; startedAt: number; acquiredAt: number; nonce: string };

/** A lock older than this is reclaimed even when its owner looks alive (its PID may have been reused). */
export const LOCK_STALE_MS = 30_000;
const LOCK_WAIT_MS = 10_000;

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** A file's text, or null when it doesn't exist. Busy reads are retried (see retryWhileBusy). */
function readText(file: string): string | null {
  let text: string | null = null;
  retryWhileBusy(() => {
    try {
      text = fs.readFileSync(file, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      text = null;
    }
  });
  return text;
}

function readLock(lock: string): { text: string; owner: LockOwner | null; ageMs: number } | null {
  const text = readText(lock);
  if (text === null) return null;
  let ageMs: number;
  try {
    ageMs = Date.now() - fs.statSync(lock).mtimeMs;
  } catch {
    return null; // released since the read
  }
  let owner: LockOwner | null = null;
  try {
    const parsed = JSON.parse(text) as Partial<LockOwner>;
    if (Number.isInteger(parsed.pid) && typeof parsed.host === "string") owner = parsed as LockOwner;
  } catch {
    // Empty (its owner hasn't written it yet) or not ours: only its age counts.
  }
  return { text, owner, ageMs };
}

/** The lock's owner is on this machine and its process has exited. */
function ownerDead(owner: LockOwner | null): boolean {
  return !!owner && owner.host === os.hostname() && owner.pid !== process.pid && !pidAlive(owner.pid);
}

/** Reclaimers hold `<lock>.reclaim` for microseconds; one older than this belongs to a reclaimer that died. */
const RECLAIM_MUTEX_STALE_MS = 5_000;

/**
 * Deletes the lock only if it still holds `judged`, the text a waiter read and found stale. A
 * judgement can be out of date (the owner released, then exited, and someone else took the lock),
 * so reclaimers take `<lock>.reclaim` and re-read the lock under it. A dead owner can't release,
 * and other reclaimers wait, so the text can't change between that re-read and the delete. (A lock
 * reclaimed only for its age, whose owner is alive after LOCK_STALE_MS, is the one exception.)
 */
function reclaimLock(lock: string, judged: string): void {
  const mutex = `${lock}.reclaim`;
  let fd: number;
  try {
    fd = fs.openSync(mutex, "wx");
  } catch {
    // Another waiter is reclaiming. Clear its mutex only if that waiter died mid-reclaim.
    try {
      if (Date.now() - fs.statSync(mutex).mtimeMs > RECLAIM_MUTEX_STALE_MS) retryWhileBusy(() => fs.rmSync(mutex, { force: true }));
    } catch {
      // gone already
    }
    sleepMs(5);
    return;
  }
  fs.closeSync(fd);
  try {
    if (readText(lock) === judged) retryWhileBusy(() => fs.rmSync(lock, { force: true }));
  } finally {
    retryWhileBusy(() => fs.rmSync(mutex, { force: true }));
  }
}

function withRegistryLock<T>(root: string, fn: () => T): T {
  fs.mkdirSync(root, { recursive: true });
  const lock = `${registryPath(root)}.lock`;
  const deadline = Date.now() + LOCK_WAIT_MS;
  const owner: LockOwner = {
    pid: process.pid,
    host: os.hostname(),
    startedAt: Math.round(Date.now() - process.uptime() * 1000),
    acquiredAt: Date.now(),
    nonce: randomBytes(8).toString("hex"),
  };
  // Unique per acquisition, so a reclaimer's "still the lock I judged stale" check can't be fooled.
  const token = JSON.stringify(owner);
  for (;;) {
    let fd: number | null = null;
    try {
      fd = fs.openSync(lock, "wx");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      // On Windows a lock file that is still being deleted can't be opened (EPERM) until it is gone.
      if (code !== "EEXIST" && !(code === "EPERM" && process.platform === "win32")) throw err;
    }
    if (fd !== null) {
      fs.writeSync(fd, token);
      fs.closeSync(fd);
      break;
    }
    const held = readLock(lock);
    if (held === null) continue;
    if (ownerDead(held.owner) || held.ageMs > LOCK_STALE_MS) {
      reclaimLock(lock, held.text);
      continue;
    }
    if (Date.now() > deadline) {
      const who = held.owner ? `pid ${held.owner.pid} on ${held.owner.host}, still running` : "an unknown owner";
      throw new Error(`Timed out waiting for ${lock}: held by ${who} for ${Math.round(held.ageMs / 1000)}s`);
    }
    sleepMs(20);
  }
  try {
    return fn();
  } finally {
    // Release only our own lock; a waiter may have reclaimed it if fn() ran past LOCK_STALE_MS.
    if (readText(lock) === token) retryWhileBusy(() => fs.rmSync(lock, { force: true }));
  }
}

/** Replaces `file` with `tmp` in one step (see retryWhileBusy). The temp file is always removed. */
function replaceFile(tmp: string, file: string): void {
  try {
    retryWhileBusy(() => fs.renameSync(tmp, file));
  } finally {
    retryWhileBusy(() => fs.rmSync(tmp, { force: true }));
  }
}

/** `"auto"` only: search `min`-`max` (default the whole range) and pass over ports `skip` rejects. */
export type ClaimOptions = { min?: number; max?: number; skip?: (port: number) => boolean };

/**
 * Claim an app port for a worktree. `"auto"` reuses the worktree's existing claim or takes the
 * lowest free port. A specific port fails if another worktree already holds it.
 */
export function claimPort(
  worktree: string,
  requested: number | "auto",
  root = defaultValidationRoot(),
  opts: ClaimOptions = {},
): number {
  return withRegistryLock(root, () => {
    const registry = readRegistry(root);
    const key = worktreeKey(worktree);
    const owner = (port: number) => Object.entries(registry).find(([k, p]) => p === port && k !== key)?.[0];
    let port: number;
    if (requested === "auto") {
      if (registry[key] !== undefined) return registry[key];
      const taken = new Set(Object.values(registry));
      const min = parseAppPort(opts.min ?? APP_PORT_MIN);
      const max = parseAppPort(opts.max ?? APP_PORT_MAX);
      const free = Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => min + i).find(
        (p) => !taken.has(p) && !opts.skip?.(p),
      );
      if (free === undefined) throw new Error(`No free validation app ports left in ${min}-${max}`);
      port = free;
    } else {
      port = parseAppPort(requested);
      const holder = owner(port);
      if (holder) throw new Error(`App port ${port} is already claimed by ${holder}`);
    }
    registry[key] = port;
    // Readers don't take the lock, so replace the file in one step rather than truncating it.
    const file = registryPath(root);
    const tmp = `${file}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(tmp, `${JSON.stringify(registry, null, 2)}\n`);
    } catch (err) {
      fs.rmSync(tmp, { force: true });
      throw err;
    }
    replaceFile(tmp, file);
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
