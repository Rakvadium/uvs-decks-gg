#!/usr/bin/env bun
/**
 * Stop only the processes launch.ts started (from their pid files) and delete their logs.
 *   bun .agents/skills/verify-uvs/scripts/cleanup.ts
 * Never kills by name or port. Keeps .verify-uvs/evidence/.
 */
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { EVIDENCE_DIR, isAlive, pidFile, readPid, STATE_DIR } from "./lib";

function killTree(pid: number) {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      process.kill(pid, "SIGTERM");
    }
  }
}

for (const name of ["next", "convex"] as const) {
  const pid = readPid(name);
  if (pid && isAlive(pid)) {
    killTree(pid);
    console.log(`stopped ${name} (pid ${pid})`);
  } else if (pid) {
    console.log(`${name} pid ${pid} already gone`);
  }
  rmSync(pidFile(name), { force: true });
  rmSync(join(STATE_DIR, `${name}.log`), { force: true });
}

console.log(existsSync(EVIDENCE_DIR) ? `evidence kept: ${EVIDENCE_DIR}` : "no evidence folder");
