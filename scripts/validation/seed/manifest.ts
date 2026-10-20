/** Shared manifest, paths and git helpers for the validation seed build and reset scripts. */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, checkInvocation, formatCheck, prepareInvocation } from "../convex";
import { defaultValidationRoot } from "../ports";
import type { CatalogPin } from "./public-data";

export const MANIFEST_PATH = path.join(REPO_ROOT, "scripts", "validation", "seed", "manifest.json");
export const SEED_BRANCH = "validation-seed";
export const GOLDEN_FILE = "golden.zip";
/** The orphan branch must never produce a Vercel deployment. */
export const VERCEL_JSON = `${JSON.stringify({ git: { deploymentEnabled: false } }, null, 2)}\n`;

export type SeedMeta = { seedVersion: number; catalogVersion: number; sha256: string };

export type Manifest = {
  seedVersion: number;
  seed: string;
  epoch: number;
  /** Public production Convex URL; only public queries are called on it. */
  publicConvexUrl: string;
  catalog: CatalogPin;
  publicReadsSha256: string | null;
  meta: SeedMeta | null;
  golden: { branch: string; path: string; sha256: string; bytes: number; commit: string | null } | null;
};

export function readManifest(file = MANIFEST_PATH): Manifest {
  return JSON.parse(fs.readFileSync(file, "utf8")) as Manifest;
}

export function writeManifest(manifest: Manifest, file = MANIFEST_PATH): void {
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function seedWorkDir(root = defaultValidationRoot()): string {
  const dir = path.join(root, "seed");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function git(args: string[], opts: { input?: string | Buffer; allowFail?: boolean } = {}): string {
  const result = spawnSync("git", args, { cwd: REPO_ROOT, input: opts.input, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 && !opts.allowFail) {
    throw new Error(`git ${args.join(" ")} failed (${result.status}): ${result.stderr.trim()}`);
  }
  return result.status === 0 ? result.stdout.trim() : "";
}

export function gitOk(args: string[]): boolean {
  return spawnSync("git", args, { cwd: REPO_ROOT, stdio: "ignore" }).status === 0;
}

export function gitBlob(rev: string): Buffer {
  const result = spawnSync("git", ["cat-file", "blob", rev], { cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git cat-file blob ${rev} failed: ${result.stderr.toString("utf8").trim()}`);
  return result.stdout;
}

/**
 * Runs the guard for `appPort` and refuses unless the wrapped CLI can only reach that local
 * backend. With `repoint`, first lets the guarded wrapper rewrite `.env.local` for this port.
 */
export function assertLocalTarget(appPort: number, repoint: boolean, log: (m: string) => void): void {
  if (repoint) prepareInvocation({ argv: ["--app-port", String(appPort), "--repoint-env-local", "env", "list"], onRepoint: log });
  const check = checkInvocation({ argv: ["--app-port", String(appPort), "--check"] });
  if (!check.ok) throw new Error(`vconvex guard refused:\n${formatCheck(check)}`);
  log(`vconvex check: target=${check.target} (app port ${appPort})`);
}

/** Parses `convex run` stdout (the function's return value as JSON). */
export function parseRunOutput<T>(stdout: string): T {
  const start = stdout.search(/[[{]|null/);
  if (start === -1) throw new Error(`convex run printed no JSON: ${stdout.slice(0, 200)}`);
  return JSON.parse(stdout.slice(start)) as T;
}
