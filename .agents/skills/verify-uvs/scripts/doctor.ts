#!/usr/bin/env bun
/**
 * Read-only: is this instance worth driving?
 *   bun .agents/skills/verify-uvs/scripts/doctor.ts
 * Exits 1 when any check fails. Never starts, stops or writes anything.
 */
import { chromium } from "playwright-core";
import { BACKEND_URL, envValue, hosts, isAlive, isLocalEnv, probe, readPid, testAccount } from "./lib";

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];
const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

add(
  "env targets local Convex",
  isLocalEnv(),
  `CONVEX_DEPLOYMENT=${envValue("CONVEX_DEPLOYMENT")?.startsWith("local:") ? "local:…" : "NOT local"}`
);

const backend = await probe(`${BACKEND_URL}/version`);
add("convex backend :3210", backend === 200, backend === null ? "no answer: run launch.ts" : `HTTP ${backend}`);

const h = hosts();
for (const [label, url] of [
  ["uvs gallery", `${h.uvs}/gallery`],
  ["cyberpunk gallery", `${h.cyberpunk}/gallery`],
  ["apex sign-in", `${h.apex}/sign-in`],
] as const) {
  const status = await probe(url, 120_000);
  add(label, status !== null && status < 400, status === null ? `${url}: no answer` : `${url}: HTTP ${status}`);
}

for (const name of ["next", "convex"] as const) {
  const pid = readPid(name);
  if (pid) add(`${name} pid file`, isAlive(pid), `pid ${pid} ${isAlive(pid) ? "alive (ours)" : "DEAD: run cleanup.ts"}`);
}

add(
  "test account in .env.local",
  testAccount() !== null,
  testAccount() ? "LOCAL_TEST_EMAIL/LOCAL_TEST_PASSWORD set" : "missing: bun run local:seed --admin"
);

try {
  const browser = await chromium.launch({ channel: "chrome" });
  add("chrome for playwright-core", true, browser.version());
  await browser.close();
} catch (error) {
  add("chrome for playwright-core", false, String(error).split("\n")[0]);
}

for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name.padEnd(28)} ${c.detail}`);
const failed = checks.filter((c) => !c.ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
