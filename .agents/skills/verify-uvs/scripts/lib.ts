/** Shared paths, env and host helpers for the verify-uvs scripts. */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isLocalConvexEnv, MAIN_DEV_PORT, readEnvValue } from "../../../../scripts/lib/local-env";

export const REPO_ROOT = resolve(import.meta.dir, "../../../..");
/** Scratch state for one checkout: pid files and server logs. Gitignored. */
export const STATE_DIR = join(REPO_ROOT, ".verify-uvs");
/** Proof artifacts. Cleanup never deletes this folder. */
export const EVIDENCE_DIR = join(STATE_DIR, "evidence");
export const BACKEND_URL = "http://127.0.0.1:3210";

export function envText(): string {
  const path = join(REPO_ROOT, ".env.local");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

export function envValue(key: string): string | null {
  return readEnvValue(envText(), key);
}

export function isLocalEnv(): boolean {
  return isLocalConvexEnv(envText());
}

export function appPort(): number {
  return Number(envValue("PORT") || MAIN_DEV_PORT);
}

export function hosts(port = appPort()) {
  return {
    apex: `http://tcgdecks.localhost:${port}`,
    uvs: `http://uvs.tcgdecks.localhost:${port}`,
    cyberpunk: `http://cyberpunk.tcgdecks.localhost:${port}`,
    standalone: `http://localhost:${port}`,
  };
}

export type Hosts = ReturnType<typeof hosts>;

export function ensureDir(path: string): string {
  mkdirSync(path, { recursive: true });
  return path;
}

export function pidFile(name: "next" | "convex"): string {
  return join(STATE_DIR, `${name}.pid`);
}

export function readPid(name: "next" | "convex"): number | null {
  const path = pidFile(name);
  if (!existsSync(path)) return null;
  const pid = Number(readFileSync(path, "utf8").trim());
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * GET through 127.0.0.1 with an explicit Host header, because Bun's fetch may not resolve
 * `*.localhost`. Returns the status, or null when nothing answers.
 */
export async function probe(url: string, timeoutMs = 5000): Promise<number | null> {
  const target = new URL(url);
  const direct = `${target.protocol}//127.0.0.1:${target.port}${target.pathname}${target.search}`;
  try {
    const res = await fetch(direct, {
      headers: { host: target.host },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.status;
  } catch {
    return null;
  }
}

export function testAccount(): { email: string; password: string } | null {
  const email = envValue("LOCAL_TEST_EMAIL");
  const password = envValue("LOCAL_TEST_PASSWORD");
  return email && password ? { email, password } : null;
}
