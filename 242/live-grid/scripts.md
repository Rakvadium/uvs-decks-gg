# #242 live probe scripts

Run outside the repo: `bun gen-css.ts <checkout> css-base.json` (and `css-pr.json`), then `node probe.mjs <checkout> <checkout>/.pr-captures/242`, then `node ring.mjs <checkout> <checkout>/.pr-captures/242`. Base (7d98b4b) on :8129 and this branch on :8128, each with its own local validation backend.

## gen-css.ts

```js
// Usage: bun gen-css.ts <checkout> <out.json>
// Builds the custom-palette <style> text exactly as ColorSchemeProvider.resolveCustomCss does,
// using that checkout's own generator.
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

const [checkout, out] = process.argv.slice(2);
const gen = await import(pathToFileURL(`${checkout}/src/lib/theme/generateSemanticCssVars.ts`).href);
const PALETTES: Record<string, { light: [string, string]; dark: [string, string] }> = {
  "default-custom": { light: ["#ff5000", "#272b27"], dark: ["#ff5000", "#272b27"] },
  "blue-custom": { light: ["#2b6cff", "#e8ecf2"], dark: ["#2b6cff", "#1a2233"] },
};
const ser = (v: Record<string, string>) =>
  Object.entries(v)
    .map(([k, x]) => `${k}: ${x};`)
    .join("");
const result: Record<string, { css: string; destructiveFg: { light: string; dark: string } }> = {};
for (const [name, p] of Object.entries(PALETTES)) {
  const light = gen.buildSemanticCssVars(p.light[0], p.light[1], "light");
  const dark = gen.buildSemanticCssVars(p.dark[0], p.dark[1], "dark");
  result[name] = {
    css: `\nhtml.dark[data-color-theme="custom"] { ${ser(dark)} }\nhtml[data-color-theme="custom"]:where(:not(.dark)) { ${ser(light)} }\n`,
    destructiveFg: { light: light["--destructive-foreground"], dark: dark["--destructive-foreground"] },
  };
}
writeFileSync(out, JSON.stringify(result, null, 2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.destructiveFg]))));
```

## probe.mjs

```js
// Live probe for #242. Browser-only: drops every Convex Mutation/Action frame, rewrites the
// `user:currentUser` result to a fake Admin (so /admin/ui-matrix renders), and applies a custom
// palette by pinning data-color-theme="custom" and injecting the CSS each checkout's own
// generator produces (same selectors as ColorSchemeProvider.resolveCustomCss).
// Usage: node probe.mjs <worktree> <outRoot>
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const [worktree, outRoot] = process.argv.slice(2);
const require = createRequire(path.join(worktree, "package.json"));
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const sharp = require("sharp");
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

const cssBase = JSON.parse(readFileSync(path.join(here, "css-base.json"), "utf8"));
const cssPr = JSON.parse(readFileSync(path.join(here, "css-pr.json"), "utf8"));
const RUNS = [
  { label: "live-base", port: 8129, css: cssBase, desc: "pre-#201 (7d98b4b), its own generator" },
  { label: "live-dev-unfixed", port: 8128, css: cssBase, desc: "this branch's UI + dev's unchanged generator values (the bug)" },
  { label: "live-pr", port: 8128, css: cssPr, desc: "this branch (fixed generator)" },
];
const PALETTES = Object.keys(cssPr);
const MODES = ["light", "dark"];
const FAKE_ADMIN = { _id: "probe_admin", _creationTime: 0, role: "Admin", name: "Probe", username: "probe" };

function pinAndInject({ mode, css }) {
  const apply = (root) => {
    if (root.getAttribute("data-color-theme") !== "custom") root.setAttribute("data-color-theme", "custom");
    if (root.classList.contains("dark") !== (mode === "dark")) root.classList.toggle("dark", mode === "dark");
    if (root.style.colorScheme !== mode) root.style.colorScheme = mode;
  };
  const inject = () => {
    if (!document.head) return false;
    let node = document.getElementById("probe-custom-vars");
    if (!node) {
      node = document.createElement("style");
      node.id = "probe-custom-vars";
      node.textContent = css + "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}";
    }
    document.head.appendChild(node);
    return true;
  };
  const start = () => {
    const root = document.documentElement;
    if (!root) return false;
    apply(root);
    new MutationObserver(() => apply(root)).observe(root, { attributes: true, attributeFilter: ["class", "style", "data-color-theme"] });
    return true;
  };
  if (!start()) new MutationObserver((_, o) => { if (start()) o.disconnect(); }).observe(document, { childList: true });
  if (!inject()) new MutationObserver((_, o) => { if (inject()) o.disconnect(); }).observe(document, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", inject);
}

const browser = await chromium.launch();
const report = { runs: {}, blockedConvexWrites: [], rewrites: 0 };
for (const run of RUNS) {
  const dir = path.join(outRoot, run.label);
  mkdirSync(dir, { recursive: true });
  report.runs[run.label] = { port: run.port, desc: run.desc, shots: [] };
  for (const palette of PALETTES) {
    for (const mode of MODES) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: mode, reducedMotion: "reduce" });
      await context.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
        const server = ws.connectToServer();
        const userQueryIds = new Set();
        ws.onMessage((m) => {
          let f = null;
          try { f = JSON.parse(m); } catch {}
          if (f?.type === "Mutation" || f?.type === "Action") { report.blockedConvexWrites.push(`${f.type}:${f.udfPath}`); return; }
          if (f?.type === "ModifyQuerySet") for (const mod of f.modifications ?? []) if (mod.type === "Add" && /^user(\.js)?:currentUser$/.test(mod.udfPath)) userQueryIds.add(mod.queryId);
          server.send(m);
        });
        server.onMessage((m) => {
          let f = null;
          try { f = JSON.parse(m); } catch {}
          if (f?.type === "Transition" && Array.isArray(f.modifications)) {
            let changed = false;
            for (const mod of f.modifications) if (mod.type === "QueryUpdated" && userQueryIds.has(mod.queryId)) { mod.value = FAKE_ADMIN; changed = true; report.rewrites++; }
            if (changed) { ws.send(JSON.stringify(f)); return; }
          }
          ws.send(m);
        });
      });
      await context.addInitScript(pinAndInject, { mode, css: run.css[palette].css });
      const page = await context.newPage();
      await page.goto(`http://localhost:${run.port}/admin/ui-matrix`, { waitUntil: "networkidle", timeout: 180_000 });
      const buttons = page.locator("button", { hasText: /^destructive( sm)?$/ }).filter({ visible: true });
      await buttons.first().waitFor({ timeout: 120_000 });
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(800);
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const b = buttons.nth(i);
        const info = await b.evaluate((el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(el);
          const t = range.getBoundingClientRect();
          const root = getComputedStyle(document.documentElement);
          return {
            text: el.textContent, disabled: el.disabled, color: cs.color, background: cs.backgroundColor,
            rect: { x: r.x, y: r.y, w: r.width, h: r.height }, textRect: { x: t.x, y: t.y, w: t.width, h: t.height },
            themeAttr: document.documentElement.getAttribute("data-color-theme"), dark: document.documentElement.classList.contains("dark"),
            destructiveVar: root.getPropertyValue("--destructive").trim(), destructiveFgVar: root.getPropertyValue("--destructive-foreground").trim(),
          };
        });
        const pad = 4;
        const clip = { x: Math.floor(info.rect.x) - pad, y: Math.floor(info.rect.y) - pad, width: Math.ceil(info.rect.w) + 2 * pad, height: Math.ceil(info.rect.h) + 2 * pad };
        const name = `${palette}__${mode}__${info.disabled ? "disabled" : info.text.endsWith("sm") ? "sm" : "default"}`;
        await page.screenshot({ path: path.join(dir, `${name}.png`), clip });
        report.runs[run.label].shots.push({ name, clip, ...info });
      }
      await context.close();
    }
  }
}
await browser.close();

// Compare base vs others: whole crop, and the label box (text rect, 1px pad) only.
const readPng = (p) => PNG.sync.read(readFileSync(p));
const diffCount = (a, b, box) => {
  let n = 0, max = 0;
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    const i = (y * a.width + x) * 4;
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d > 0) { n++; max = Math.max(max, d); }
  }
  return { pixels: n, maxDelta: max };
};
const comparisons = [];
for (const shot of report.runs["live-base"].shots) {
  const a = readPng(path.join(outRoot, "live-base", `${shot.name}.png`));
  const row = { name: shot.name, baseColor: shot.color };
  for (const other of ["live-dev-unfixed", "live-pr"]) {
    const o = report.runs[other].shots.find((s) => s.name === shot.name);
    const b = readPng(path.join(outRoot, other, `${shot.name}.png`));
    if (a.width !== b.width || a.height !== b.height) { row[other] = { sizeMismatch: true }; continue; }
    const tx0 = Math.max(0, Math.floor(shot.textRect.x - shot.clip.x) - 1), ty0 = Math.max(0, Math.floor(shot.textRect.y - shot.clip.y) - 1);
    const label = { x0: tx0, y0: ty0, x1: Math.min(a.width, Math.ceil(shot.textRect.x + shot.textRect.w - shot.clip.x) + 1), y1: Math.min(a.height, Math.ceil(shot.textRect.y + shot.textRect.h - shot.clip.y) + 1) };
    row[other] = {
      color: o.color, background: o.background,
      label: { box: label, ...diffCount(a, b, label) },
      wholeCrop: diffCount(a, b, { x0: 0, y0: 0, x1: a.width, y1: a.height }),
    };
  }
  comparisons.push(row);
}
report.comparisons = comparisons;
mkdirSync(path.join(outRoot, "live-grid"), { recursive: true });
writeFileSync(path.join(outRoot, "live-grid", "probe.json"), JSON.stringify(report, null, 2));

// Grid: one row per palette x mode x button, columns base | dev-unfixed | pr, x3 nearest-neighbour.
const scale = 3, gap = 6;
const rows = report.runs["live-base"].shots.map((s) => s.name);
const tiles = [];
let y = 0, width = 0;
for (const name of rows) {
  let x = 0, rowH = 0;
  for (const label of ["live-base", "live-dev-unfixed", "live-pr"]) {
    const file = path.join(outRoot, label, `${name}.png`);
    const meta = await sharp(file).metadata();
    const w = meta.width * scale, h = meta.height * scale;
    tiles.push({ input: await sharp(file).resize(w, h, { kernel: "nearest" }).png().toBuffer(), left: x, top: y });
    x += w + gap; rowH = Math.max(rowH, h);
  }
  width = Math.max(width, x); y += rowH + gap;
}
await sharp({ create: { width, height: y, channels: 4, background: { r: 128, g: 128, b: 128, alpha: 1 } } }).composite(tiles).png().toFile(path.join(outRoot, "live-grid", "destructive-grid.png"));
console.log(JSON.stringify({ rewrites: report.rewrites, blocked: [...new Set(report.blockedConvexWrites)], comparisons: comparisons.map((c) => ({ name: c.name, base: c.baseColor, unfixed: [c["live-dev-unfixed"].color, c["live-dev-unfixed"].label?.pixels, c["live-dev-unfixed"].wholeCrop?.pixels], pr: [c["live-pr"].color, c["live-pr"].label?.pixels, c["live-pr"].wholeCrop?.pixels, c["live-pr"].wholeCrop?.maxDelta] })) }, null, 1));
```

## ring.mjs

```js
// Classify base-vs-pr differing pixels: within 2px of the button edge (border ring) vs interior.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const [worktree, outRoot] = process.argv.slice(2);
const require = createRequire(path.join(worktree, "package.json"));
const { PNG } = require("pngjs");
const report = JSON.parse(readFileSync(path.join(outRoot, "live-grid", "probe.json"), "utf8"));
const rows = [];
for (const shot of report.runs["live-base"].shots) {
  const a = PNG.sync.read(readFileSync(path.join(outRoot, "live-base", `${shot.name}.png`)));
  const b = PNG.sync.read(readFileSync(path.join(outRoot, "live-pr", `${shot.name}.png`)));
  const bx0 = shot.rect.x - shot.clip.x, by0 = shot.rect.y - shot.clip.y;
  const bx1 = bx0 + shot.rect.w, by1 = by0 + shot.rect.h;
  let ring = 0, interior = 0, outside = 0, ringMax = 0, corner = 0, cornerMax = 0;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * 4;
    const d = Math.max(...[0, 1, 2].map((k) => Math.abs(a.data[i + k] - b.data[i + k])));
    if (!d) continue;
    const cx = x + 0.5, cy = y + 0.5;
    const inside = cx > bx0 && cx < bx1 && cy > by0 && cy < by1;
    const edge = Math.min(cx - bx0, bx1 - cx, cy - by0, by1 - cy);
    if (!inside) outside++;
    else if (edge <= 2) { ring++; ringMax = Math.max(ringMax, d); }
    else if (Math.min(cx - bx0, bx1 - cx) <= 12 && Math.min(cy - by0, by1 - cy) <= 12) { corner++; cornerMax = Math.max(cornerMax, d); }
    else interior++;
  }
  rows.push({ name: shot.name, ring, ringMax, corner, cornerMax, interior, outside });
}
writeFileSync(path.join(outRoot, "live-grid", "ring-classification.json"), JSON.stringify(rows, null, 2));
for (const r of rows) console.log(r.name.padEnd(32), "ring", r.ring, "maxΔ", r.ringMax, "cornerArc", r.corner, "maxΔ", r.cornerMax, "interior", r.interior, "outside", r.outside);
```
