# PR #244 independent verifier probe

Run: `node probe.mjs <worktree> <worktree>/.pr-captures/242`, PR on :8130 and 7d98b4b on :8131, each with its own wrapper-started local validation backend.

```js
// Independent verifier probe for PR #244 / issue #242.
// Drives the REAL ColorSchemeProvider: the browser is signed in (throwaway local validation backend),
// and a WebSocket proxy rewrites the `sessions:getSession` query result to a custom colorSource, so the
// provider itself runs resolveCustomCss -> buildSemanticCssVars (that checkout's generator) and mounts
// #appearance-custom-vars. `user:currentUser` is rewritten to role Admin (client-side gate only).
// Every Convex Mutation/Action frame on the WebSocket is dropped.
// Usage: node probe.mjs <worktree-for-deps> <outRoot>
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [worktree, outRoot] = process.argv.slice(2);
const require = createRequire(path.join(worktree, "package.json"));
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const sharp = require("sharp");

const RUNS = [
  { label: "verify-pre201", port: 8131 },
  { label: "verify-pr", port: 8130 },
];
// Hue and lightness varied: default brand (orange/near-black), teal on cream, deep purple, pale yellow on white,
// saturated pink on navy.
const PALETTES = {
  "default-brand": { light: { primary: "#ff5000", secondary: "#272b27" }, dark: { primary: "#ff5000", secondary: "#272b27" } },
  "teal-cream": { light: { primary: "#00b3a4", secondary: "#f4f1e8" }, dark: { primary: "#00b3a4", secondary: "#0f1f1d" } },
  "deep-purple": { light: { primary: "#4c1d95", secondary: "#ede4f7" }, dark: { primary: "#7c3aed", secondary: "#140b22" } },
  "pale-yellow": { light: { primary: "#f5e663", secondary: "#ffffff" }, dark: { primary: "#f5e663", secondary: "#000000" } },
};
const MODES = ["light", "dark"];
const OLD_FG = { light: "oklch(0.985 0 0)", dark: "oklch(0.98 0 0)" };

const blocked = new Set();
let sessionRewrites = 0, userRewrites = 0;

async function signUp(browser, port) {
  const ctx = await browser.newContext();
  const id = crypto.randomBytes(4).toString("hex");
  const res = await ctx.request.post(`http://localhost:${port}/api/auth`, {
    data: { action: "auth:signIn", args: { provider: "password", params: { email: `verify244-${id}@example.test`, password: `Verify244${id}9`, username: `v244${id}`, flow: "signUp" } } },
  });
  const body = await res.json();
  if (!res.ok() || !body.tokens) throw new Error(`sign-up on ${port} failed: ${res.status()}`);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

async function newProbeContext(browser, state, mode, palette) {
  const context = await browser.newContext({ storageState: state, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: mode, reducedMotion: "reduce" });
  await context.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
    const server = ws.connectToServer();
    const ids = new Map();
    ws.onMessage((m) => {
      let f = null;
      try { f = JSON.parse(m); } catch {}
      if (f?.type === "Mutation" || f?.type === "Action") { blocked.add(`${f.type}:${f.udfPath}`); return; }
      if (f?.type === "ModifyQuerySet") for (const mod of f.modifications ?? []) if (mod.type === "Add") ids.set(mod.queryId, mod.udfPath.replace(/\.js$/, ""));
      server.send(m);
    });
    server.onMessage((m) => {
      let f = null;
      try { f = JSON.parse(m); } catch {}
      if (f?.type === "Transition" && Array.isArray(f.modifications)) {
        let changed = false;
        for (const mod of f.modifications) {
          if (mod.type !== "QueryUpdated") continue;
          const p = ids.get(mod.queryId);
          if (p === "sessions:getSession") {
            mod.value = { _id: "verify_session", _creationTime: 0, userId: "verify_user", theme: mode, chrome: "calm", colorSource: { kind: "custom", custom: { fallback: palette } } };
            changed = true; sessionRewrites++;
          } else if (p === "user:currentUser" && mod.value) {
            mod.value = { ...mod.value, role: "Admin" };
            changed = true; userRewrites++;
          }
        }
        if (changed) { ws.send(JSON.stringify(f)); return; }
      }
      ws.send(m);
    });
  });
  await context.addInitScript(() => {
    const css = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}";
    const add = () => { if (!document.head) return false; const s = document.createElement("style"); s.id = "verify-no-motion"; s.textContent = css; document.head.appendChild(s); return true; };
    if (!add()) document.addEventListener("DOMContentLoaded", add);
  });
  return context;
}

const measure = (el) => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(el);
  const t = range.getBoundingClientRect();
  const root = getComputedStyle(document.documentElement);
  return {
    text: el.textContent, disabled: el.disabled, color: cs.color, background: cs.backgroundColor, className: el.className,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height }, textRect: { x: t.x, y: t.y, w: t.width, h: t.height },
    destructiveFgVar: root.getPropertyValue("--destructive-foreground").trim(), destructiveVar: root.getPropertyValue("--destructive").trim(),
  };
};

const browser = await chromium.launch();
const report = { runs: {}, palettes: PALETTES };
for (const run of RUNS) {
  const dir = path.join(outRoot, run.label);
  mkdirSync(dir, { recursive: true });
  const state = await signUp(browser, run.port);
  report.runs[run.label] = { port: run.port, shots: [], pages: [] };
  for (const [pname, palette] of Object.entries(PALETTES)) {
    for (const mode of MODES) {
      const context = await newProbeContext(browser, state, mode, palette);
      const page = await context.newPage();
      await page.goto(`http://localhost:${run.port}/admin/ui-matrix`, { waitUntil: "networkidle", timeout: 180_000 });
      // Wait until the REAL provider has applied the custom palette.
      await page.waitForFunction((m) => {
        const root = document.documentElement;
        const s = document.getElementById("appearance-custom-vars");
        return root.getAttribute("data-color-theme") === "custom" && root.classList.contains("dark") === (m === "dark") && !!s && s.textContent.includes("--destructive-foreground");
      }, mode, { timeout: 120_000 });
      const buttons = page.locator("button", { hasText: /^destructive( sm)?$/ }).filter({ visible: true });
      await buttons.first().waitFor({ timeout: 120_000 });
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(800);
      const providerInfo = await page.evaluate(() => {
        const s = document.getElementById("appearance-custom-vars").textContent;
        const styles = [...document.querySelectorAll("style")].map((n) => n.id).filter(Boolean);
        const m = [...s.matchAll(/--destructive-foreground:\s*([^;]+);/g)].map((x) => x[1]);
        return { providerDestructiveFg: m, styleIds: styles, chrome: document.documentElement.getAttribute("data-chrome") };
      });
      const tag = `${pname}__${mode}`;
      await page.screenshot({ path: path.join(dir, `page__${tag}.png`), fullPage: true });
      const count = await buttons.count();
      const shots = [];
      for (let i = 0; i < count; i++) {
        const info = await buttons.nth(i).evaluate(measure);
        const pad = 4;
        const clip = { x: Math.floor(info.rect.x) - pad, y: Math.floor(info.rect.y) - pad, width: Math.ceil(info.rect.w) + 2 * pad, height: Math.ceil(info.rect.h) + 2 * pad };
        const name = `${tag}__${info.disabled ? "disabled" : info.text.endsWith("sm") ? "sm" : "default"}`;
        await page.screenshot({ path: path.join(dir, `${name}.png`), clip });
        shots.push({ name, clip, ...info });
      }
      report.runs[run.label].shots.push(...shots);
      const pageRec = { tag, ...providerInfo };
      // Sensitivity control on the PR: force the old (pre-fix) token value inline and re-shoot.
      if (run.label === "verify-pr") {
        await page.evaluate((v) => document.documentElement.style.setProperty("--destructive-foreground", v), OLD_FG[mode]);
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(dir, `page-oldtoken__${tag}.png`), fullPage: true });
        for (const s of shots) {
          await page.screenshot({ path: path.join(dir, `oldtoken__${s.name}.png`), clip: s.clip });
          s.oldTokenColor = await buttons.nth(shots.indexOf(s)).evaluate((el) => getComputedStyle(el).color);
        }
        await page.evaluate(() => document.documentElement.style.removeProperty("--destructive-foreground"));
      }
      report.runs[run.label].pages.push(pageRec);
      await context.close();
    }
  }
}
await browser.close();

const readPng = (p) => PNG.sync.read(readFileSync(p));
const diff = (a, b, box) => {
  let n = 0, max = 0;
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    const i = (y * a.width + x) * 4;
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d > 0) { n++; max = Math.max(max, d); }
  }
  return { pixels: n, maxDelta: max };
};
const labelBox = (shot, w, h) => ({
  x0: Math.max(0, Math.floor(shot.textRect.x - shot.clip.x) - 1), y0: Math.max(0, Math.floor(shot.textRect.y - shot.clip.y) - 1),
  x1: Math.min(w, Math.ceil(shot.textRect.x + shot.textRect.w - shot.clip.x) + 1), y1: Math.min(h, Math.ceil(shot.textRect.y + shot.textRect.h - shot.clip.y) + 1),
});
const comparisons = [];
for (const base of report.runs["verify-pre201"].shots) {
  const pr = report.runs["verify-pr"].shots.find((s) => s.name === base.name);
  const a = readPng(path.join(outRoot, "verify-pre201", `${base.name}.png`));
  const b = readPng(path.join(outRoot, "verify-pr", `${base.name}.png`));
  const o = readPng(path.join(outRoot, "verify-pr", `oldtoken__${base.name}.png`));
  const row = { name: base.name, preColor: base.color, prColor: pr?.color, prOldTokenColor: pr?.oldTokenColor, preFgVar: base.destructiveFgVar, prFgVar: pr?.destructiveFgVar };
  if (a.width !== b.width || a.height !== b.height) { row.sizeMismatch = [a.width, a.height, b.width, b.height]; comparisons.push(row); continue; }
  const sameTextRect = JSON.stringify(base.textRect) === JSON.stringify(pr.textRect) && base.rect.w === pr.rect.w && base.rect.h === pr.rect.h;
  const box = labelBox(base, a.width, a.height);
  row.sameGeometry = sameTextRect;
  row.labelBoxPixels = (box.x1 - box.x0) * (box.y1 - box.y0);
  row.labelPreVsPr = diff(a, b, box);
  row.labelPreVsOldToken = diff(a, o, box);
  row.cropPreVsPr = diff(a, b, { x0: 0, y0: 0, x1: a.width, y1: a.height });
  comparisons.push(row);
}
// Whole-page control on the PR: fixed token vs old token. Differences must lie only inside destructive buttons.
const pageControl = [];
for (const pg of report.runs["verify-pr"].pages) {
  const a = readPng(path.join(outRoot, "verify-pr", `page__${pg.tag}.png`));
  const b = readPng(path.join(outRoot, "verify-pr", `page-oldtoken__${pg.tag}.png`));
  const rects = report.runs["verify-pr"].shots.filter((s) => s.name.startsWith(pg.tag + "__")).map((s) => s.rect);
  let inside = 0, outside = 0;
  if (a.width === b.width && a.height === b.height) {
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      if (a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] && a.data[i + 2] === b.data[i + 2]) continue;
      const hit = rects.some((r) => x + 0.5 > r.x && x + 0.5 < r.x + r.w && y + 0.5 > r.y && y + 0.5 < r.y + r.h);
      if (hit) inside++; else outside++;
    }
  }
  pageControl.push({ tag: pg.tag, size: [a.width, a.height, b.width, b.height], diffInsideDestructiveButtons: inside, diffElsewhere: outside });
}
report.comparisons = comparisons;
report.pageControl = pageControl;
report.blockedConvexWrites = [...blocked];
report.sessionRewrites = sessionRewrites;
report.userRewrites = userRewrites;
mkdirSync(path.join(outRoot, "verify-grid"), { recursive: true });
writeFileSync(path.join(outRoot, "verify-grid", "probe.json"), JSON.stringify(report, null, 2));

// Grid: rows = palette x mode x button; columns pre-#201 | PR | PR with old token (control). x3 nearest.
const scale = 3, gap = 6;
const tiles = [];
let y = 0, width = 0;
for (const c of comparisons) {
  let x = 0, rowH = 0;
  for (const file of [path.join(outRoot, "verify-pre201", `${c.name}.png`), path.join(outRoot, "verify-pr", `${c.name}.png`), path.join(outRoot, "verify-pr", `oldtoken__${c.name}.png`)]) {
    const meta = await sharp(file).metadata();
    const w = meta.width * scale, h = meta.height * scale;
    tiles.push({ input: await sharp(file).resize(w, h, { kernel: "nearest" }).png().toBuffer(), left: x, top: y });
    x += w + gap; rowH = Math.max(rowH, h);
  }
  width = Math.max(width, x); y += rowH + gap;
}
await sharp({ create: { width, height: y, channels: 4, background: { r: 128, g: 128, b: 128, alpha: 1 } } }).composite(tiles).png().toFile(path.join(outRoot, "verify-grid", "destructive-grid.png"));
console.log(JSON.stringify({ sessionRewrites, userRewrites, blocked: [...blocked], pages: report.runs["verify-pr"].pages.map((p) => [p.tag, p.providerDestructiveFg.join("|"), p.chrome]), prePages: report.runs["verify-pre201"].pages.map((p) => [p.tag, p.providerDestructiveFg.join("|")]), comparisons: comparisons.map((c) => [c.name, c.preColor, c.prColor, c.prOldTokenColor, c.sameGeometry, c.labelBoxPixels, c.labelPreVsPr?.pixels, c.labelPreVsOldToken?.pixels, c.cropPreVsPr?.pixels, c.cropPreVsPr?.maxDelta, c.sizeMismatch]), pageControl }, null, 1));
```
