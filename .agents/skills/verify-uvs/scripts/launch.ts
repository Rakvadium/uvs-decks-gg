#!/usr/bin/env bun
/**
 * Start what verification needs, reusing anything already serving.
 *   bun .agents/skills/verify-uvs/scripts/launch.ts
 * Prints READY when the backend and Next both answer. Only processes this script starts get a
 * pid file, so cleanup.ts never kills a server you (or another agent) started.
 */
import { spawn } from "node:child_process";
import { openSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  appPort,
  BACKEND_URL,
  ensureDir,
  hosts,
  isAlive,
  isLocalEnv,
  pidFile,
  probe,
  readPid,
  REPO_ROOT,
  STATE_DIR,
} from "./lib";

async function waitFor(label: string, check: () => Promise<boolean>, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await Bun.sleep(1000);
  }
  throw new Error(`${label} did not become ready within ${timeoutMs / 1000}s`);
}

function startDetached(name: "next" | "convex", args: string[]): number {
  ensureDir(STATE_DIR);
  const log = openSync(join(STATE_DIR, `${name}.log`), "a");
  const child = spawn("bun", args, {
    cwd: REPO_ROOT,
    detached: true,
    stdio: ["ignore", log, log],
    windowsHide: true,
  });
  if (!child.pid) throw new Error(`failed to spawn ${name}`);
  child.unref();
  writeFileSync(pidFile(name), String(child.pid));
  console.log(`started ${name} (pid ${child.pid}), log: .verify-uvs/${name}.log`);
  return child.pid;
}

if (!isLocalEnv()) {
  console.error(
    "REFUSING: .env.local does not target a local: Convex deployment on loopback. " +
      "Production is honorable-shrimp-618; see docs/local-convex.md."
  );
  process.exit(2);
}

const backendUp = async () => (await probe(`${BACKEND_URL}/version`)) === 200;
if (await backendUp()) {
  console.log("convex backend: already up on :3210 (reused; not ours to stop)");
} else {
  const stale = readPid("convex");
  if (stale && isAlive(stale)) throw new Error(`convex pid ${stale} is alive but :3210 is down; run cleanup.ts`);
  startDetached("convex", ["x", "convex", "dev"]);
  await waitFor("convex backend", backendUp, 180_000);
  console.log("convex backend: up");
}

const port = appPort();
const h = hosts(port);
const nextUp = async () => (await probe(`${h.standalone}/`)) !== null;
if (await nextUp()) {
  const ours = readPid("next");
  console.log(
    ours && isAlive(ours)
      ? `next: already up on :${port} (ours, pid ${ours})`
      : `next: already up on :${port} (reused; not ours to stop)`
  );
} else {
  startDetached("next", ["run", "dev"]);
  await waitFor("next dev server", nextUp, 180_000);
}

// First compile of the gallery route is slow; warm it so the first drive doesn't time out.
const warm = await probe(`${h.uvs}/gallery`, 180_000);
console.log(`warm ${h.uvs}/gallery -> ${warm ?? "no answer"}`);
console.log(`READY ${JSON.stringify(h)}`);
