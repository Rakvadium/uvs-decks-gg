#!/usr/bin/env bun
/**
 * Run a scenario in a fresh, isolated Chrome context and capture evidence.
 *   bun .agents/skills/verify-uvs/scripts/drive.ts <scenario.ts> [--name <label>] [--headed] [--mobile]
 *
 * A scenario default-exports `async (ctx: DriveContext) => void`; see scenarios/smoke.ts.
 * Evidence lands in .verify-uvs/evidence/<timestamp>-<name>/:
 *   NN-<label>.png   one screenshot per ctx.shot()/ctx.step()
 *   events.jsonl     console errors/warnings, page errors, failed requests, HTTP >= 400
 *   trace.zip        Playwright trace (bunx playwright-core show-trace <path>)
 *   summary.json     steps with pass/fail, final URL, event counts
 * Exits 1 when the scenario throws.
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { chromium, devices, type BrowserContext, type Page } from "playwright-core";
import { ensureDir, EVIDENCE_DIR, hosts, type Hosts, testAccount } from "./lib";

export type DriveContext = {
  page: Page;
  context: BrowserContext;
  hosts: Hosts;
  out: string;
  /** Screenshot the current page as NN-<label>.png. */
  shot: (label: string) => Promise<string>;
  /** Run fn as a named step; screenshots after it, records pass/fail, rethrows on failure. */
  step: <T>(label: string, fn: () => Promise<T>) => Promise<T>;
  /** Sign in with LOCAL_TEST_* through the real form, starting from `from` (default: uvs gallery). */
  signIn: (from?: string) => Promise<void>;
  log: (message: string) => void;
};

const args = process.argv.slice(2);
const scenarioPath = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--name");
if (!scenarioPath) {
  console.error("usage: bun drive.ts <scenario.ts> [--name <label>] [--headed] [--mobile]");
  process.exit(2);
}
const nameIndex = args.indexOf("--name");
const name = nameIndex >= 0 ? args[nameIndex + 1] : basename(scenarioPath).replace(/\.\w+$/, "");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = ensureDir(join(EVIDENCE_DIR, `${stamp}-${name}`));
const eventsPath = join(out, "events.jsonl");
const counts: Record<string, number> = {};
const record = (type: string, data: Record<string, unknown>) => {
  counts[type] = (counts[type] ?? 0) + 1;
  appendFileSync(eventsPath, `${JSON.stringify({ t: new Date().toISOString(), type, ...data })}\n`);
};

const h = hosts();
const browser = await chromium.launch({ channel: "chrome", headless: !args.includes("--headed") });
const context = await browser.newContext(
  args.includes("--mobile") ? { ...devices["iPhone 13"] } : { viewport: { width: 1440, height: 900 } }
);
await context.tracing.start({ screenshots: true, snapshots: true });
const page = await context.newPage();
page.setDefaultTimeout(30_000);
page.setDefaultNavigationTimeout(120_000);

page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") record(`console.${m.type()}`, { text: m.text(), url: page.url() });
});
page.on("pageerror", (e) => record("pageerror", { text: e.message, url: page.url() }));
page.on("requestfailed", (r) => {
  const failure = r.failure()?.errorText ?? "";
  if (!failure.includes("ERR_ABORTED")) record("requestfailed", { url: r.url(), failure });
});
page.on("response", (r) => {
  if (r.status() >= 400) record("http", { status: r.status(), url: r.url() });
});

let shots = 0;
const steps: { label: string; ok: boolean; error?: string; shot?: string }[] = [];
const shot = async (label: string) => {
  shots += 1;
  const file = join(out, `${String(shots).padStart(2, "0")}-${label.replace(/[^\w-]+/g, "_")}.png`);
  await page.screenshot({ path: file });
  return file;
};

const ctx: DriveContext = {
  page,
  context,
  hosts: h,
  out,
  shot,
  log: (message) => {
    console.log(message);
    record("log", { text: message });
  },
  step: async (label, fn) => {
    try {
      const result = await fn();
      steps.push({ label, ok: true, shot: await shot(label) });
      console.log(`ok    ${label}`);
      return result;
    } catch (error) {
      const file = await shot(`FAILED-${label}`).catch(() => undefined);
      steps.push({ label, ok: false, error: String(error), shot: file });
      console.log(`FAIL  ${label}: ${String(error).split("\n")[0]}`);
      throw error;
    }
  },
  signIn: async (from = `${h.uvs}/gallery`) => {
    const account = testAccount();
    if (!account) throw new Error("LOCAL_TEST_* missing from .env.local: run `bun run local:seed --admin`");
    const origin = new URL(from).origin;
    await page.goto(`${origin}/sign-in?next=${encodeURIComponent(new URL(from).pathname)}`);
    await page.locator("#sign-in-email").fill(account.email);
    await page.locator("#sign-in-password").fill(account.password);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.startsWith("/sign-in") && !url.pathname.startsWith("/auth/"), {
      timeout: 60_000,
    });
  },
};

let failed = false;
try {
  const mod = await import(resolve(scenarioPath));
  await mod.default(ctx);
} catch (error) {
  failed = true;
  console.error(String(error));
} finally {
  const finalUrl = page.url();
  await context.tracing.stop({ path: join(out, "trace.zip") }).catch(() => {});
  await browser.close();
  writeFileSync(
    join(out, "summary.json"),
    JSON.stringify({ scenario: scenarioPath, ok: !failed, finalUrl, steps, events: counts }, null, 2)
  );
  console.log(`\n${failed ? "FAILED" : "PASSED"}  events: ${JSON.stringify(counts)}`);
  console.log(`evidence: ${out}`);
}
process.exit(failed ? 1 : 0);
