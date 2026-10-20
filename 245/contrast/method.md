# #245 badge contrast: method and scripts (read-only)

Throwaway scripts, not committed. They ran against `next dev -p 8179` on a local validation backend (golden seed v1). One synthetic local admin applied the moderation through `adminUsers:bulkSetTierListListModeration`. The browser is signed out, and every Convex Mutation/Action frame is dropped.

- **contrast.mjs**: for each of the 8 palettes × light/dark, it pins `data-color-theme` and `.dark` on `<html>` and opens `/community/tier-lists`. It reads the palette tokens from a real feed card with `getComputedStyle`, resolves each color to sRGB through a canvas, and flattens the card background (ancestor `background-color`s; gradients are ignored). It then composites each candidate badge fill at its tone-ladder alpha (wash /10, selected /20, solid) and computes the WCAG contrast of text vs fill. Tailwind only emits classes used in source, so the candidates come from tokens, not classes.
- **badge-crops.mjs**: crops the real badges. The browser-side results of `user:currentUser`, `tierLists:getDetail` and `tierLists:listPublicFeed` are swapped for what `vconvex run --identity <owner>` returns. It also measures each rendered badge from its computed `color` and its fill, flattened over its ancestors. The rendered numbers agree with contrast.mjs within ~0.05.

## contrast.mjs

```js
// Throwaway, read-only contrast probe for #245. Usage (from the worktree root): node <this file> [port]
// For each palette x mode, opens the signed-out tier list browser, reads the palette's tokens with
// getComputedStyle, resolves them to sRGB through a canvas, composites the badge fill over the real
// card background (ancestor background-colors, flattened), and prints WCAG contrast of badge text vs
// badge fill for each candidate style. All Convex Mutation/Action frames are dropped.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("playwright");
const PORT = process.argv[2] ?? "8179";
const PALETTES = ["default", "aurora", "caffeine", "calm-storm", "cotton-candy", "cyberpunk", "singularity", "sorbet"];
const MODES = ["light", "dark"];

// fill = [token, alpha]; text = token. Tone ladder: wash /10, selected /20, solid.
const CANDIDATES = {
  "warning: before (selected fill, text-warning)": { fill: ["--warning", 0.2], text: "--warning" },
  "warning: after (wash fill, text-foreground)": { fill: ["--warning", 0.1], text: "--foreground" },
  "warning: solid (bg-warning, text-warning-foreground)": { fill: ["--warning", 1], text: "--warning-foreground" },
  "warning: wash fill, text-warning": { fill: ["--warning", 0.1], text: "--warning" },
  "destructive: before (selected fill, text-destructive)": { fill: ["--destructive", 0.2], text: "--destructive" },
  "destructive: after (wash fill, text-foreground)": { fill: ["--destructive", 0.1], text: "--foreground" },
  "destructive: solid (bg-destructive, text-destructive-foreground)": { fill: ["--destructive", 1], text: "--destructive-foreground" },
  "destructive: wash fill, text-destructive": { fill: ["--destructive", 0.1], text: "--destructive" },
};

function pin({ theme, mode }) {
  const apply = (el) => {
    if (el.getAttribute("data-color-theme") !== theme) el.setAttribute("data-color-theme", theme);
    if (el.classList.contains("dark") !== (mode === "dark")) el.classList.toggle("dark", mode === "dark");
  };
  const start = () => {
    const el = document.documentElement;
    if (!el) return false;
    apply(el);
    new MutationObserver(() => apply(el)).observe(el, { attributes: true, attributeFilter: ["class", "data-color-theme"] });
    return true;
  };
  if (!start()) new MutationObserver((_, o) => { if (start()) o.disconnect(); }).observe(document, { childList: true });
}

function measure(candidates) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = (css) => {
    g.clearRect(0, 0, 1, 1);
    g.fillStyle = "#000";
    g.fillStyle = css;
    g.fillRect(0, 0, 1, 1);
    const [r, gg, b, a] = g.getImageData(0, 0, 1, 1).data;
    return [r, gg, b, a / 255];
  };
  const over = (top, bottom) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
  };
  const lum = ([r, g2, b]) => {
    const c = [r, g2, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  // The badge row inside the first tier list card.
  const anchor = [...document.querySelectorAll('[data-slot="card"], .chrome-label-case')].find((el) =>
    el.textContent?.trim() === "Public"
  )?.parentElement;
  if (!anchor) return { error: "no card badge row" };
  const chain = [];
  for (let el = anchor; el; el = el.parentElement) chain.push(el);
  let bg = [255, 255, 255, 1];
  const rootBg = rgba(getComputedStyle(document.documentElement).backgroundColor);
  if (rootBg[3] > 0) bg = over(rootBg, bg);
  for (const el of chain.reverse()) {
    const c = rgba(getComputedStyle(el).backgroundColor);
    if (c[3] > 0) bg = over(c, bg);
  }
  const token = (name) => getComputedStyle(anchor).getPropertyValue(name).trim();
  const out = {};
  for (const [name, { fill, text }] of Object.entries(candidates)) {
    const f = rgba(token(fill[0]));
    const fillRgb = over([f[0], f[1], f[2], fill[1]], bg);
    out[name] = Math.round(ratio(rgba(token(text)), fillRgb) * 100) / 100;
  }
  return { out, cardBg: bg.slice(0, 3) };
}

const browser = await chromium.launch();
const rows = [];
try {
  for (const theme of PALETTES) {
    for (const mode of MODES) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: mode });
      await context.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
        const server = ws.connectToServer();
        ws.onMessage((m) => {
          try {
            const f = JSON.parse(m);
            if (f?.type === "Mutation" || f?.type === "Action") return;
          } catch {}
          server.send(m);
        });
      });
      await context.addInitScript(pin, { theme, mode });
      const page = await context.newPage();
      await page.goto(`http://localhost:${PORT}/community/tier-lists`);
      await page.locator("text=Favorite foundations >> visible=true").first().waitFor({ timeout: 120_000 });
      await page.waitForTimeout(800);
      const res = await page.evaluate(measure, CANDIDATES);
      rows.push({ theme, mode, ...res });
      console.log(theme, mode, JSON.stringify(res.out ?? res));
      await context.close();
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(process.env.TEMP ?? ".", "probe245", "contrast.json"), JSON.stringify(rows, null, 2));
```

## badge-crops.mjs

```js
// Throwaway, read-only badge crops for #245. Usage (from the worktree root): node <this file> <label> [port]
// Signed out. The WebSocket proxy drops every Mutation/Action frame and swaps the browser-side results
// of user:currentUser, tierLists:getDetail and tierLists:listPublicFeed for what the server returns to
// the list owner via `vconvex run --identity` on the local backend. Crops each owner badge (detail meta
// cluster and feed card) in a few palette x mode pins.
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("playwright");

const label = process.argv[2];
if (!label) throw new Error("label required");
const PORT = process.argv[3] ?? "8179";
const CASES = [
  { status: "rejected", badge: "Rejected", owner: "r17a8pbz6fk5jetx6b1dv8y47m84gra6", list: "qs7b2s2cvb4vqkczfgwnq6z2tp0zj4tr", title: "bruno-validation character rankings" },
  { status: "pending", badge: "In review", owner: "r171kckp68406hb7sp0ajzqfwgrrrf16", list: "qs70fppx3m5pjynp16tv32asewf9w3sh", title: "chen-validation character rankings" },
];
const PINS = [
  { theme: "default", mode: "light" },
  { theme: "default", mode: "dark" },
  { theme: "sorbet", mode: "light" },
];
const out = path.join(root, ".pr-captures", "245", `badge-${label}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

function asUser(userId, fn, args) {
  const identity = JSON.stringify({ subject: `${userId}|probe`, issuer: "https://probe.invalid", tokenIdentifier: `probe|${userId}` });
  const r = spawnSync("bun", ["run", "vconvex", "--", "--app-port", PORT, "run", "--identity", identity, fn, JSON.stringify(args)], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${fn} failed (exit ${r.status})`);
  const s = r.stdout.trim();
  return JSON.parse(s.slice(s.search(/^(\{|\[|null)/m)));
}

function pin({ theme, mode }) {
  const apply = (el) => {
    if (el.getAttribute("data-color-theme") !== theme) el.setAttribute("data-color-theme", theme);
    if (el.classList.contains("dark") !== (mode === "dark")) el.classList.toggle("dark", mode === "dark");
    if (el.style.colorScheme !== mode) el.style.colorScheme = mode;
  };
  const start = () => {
    const el = document.documentElement;
    if (!el) return false;
    apply(el);
    new MutationObserver(() => apply(el)).observe(el, { attributes: true, attributeFilter: ["class", "style", "data-color-theme"] });
    return true;
  };
  if (!start()) new MutationObserver((_, o) => { if (start()) o.disconnect(); }).observe(document, { childList: true });
}

const blocked = {};
async function proxy(context, replacements) {
  await context.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
    const server = ws.connectToServer();
    const subs = new Map();
    ws.onMessage((message) => {
      let frame = null;
      try { frame = JSON.parse(message); } catch {}
      if (frame?.type === "Mutation" || frame?.type === "Action") { blocked[`${frame.type}:${frame.udfPath}`] = (blocked[`${frame.type}:${frame.udfPath}`] ?? 0) + 1; return; }
      if (frame?.type === "ModifyQuerySet") {
        for (const m of frame.modifications ?? []) {
          if (m.type === "Add") subs.set(m.queryId, { udfPath: m.udfPath.replace(".js:", ":"), args: m.args?.[0] });
          if (m.type === "Remove") subs.delete(m.queryId);
        }
      }
      server.send(message);
    });
    server.onMessage((message) => {
      let frame = null;
      try { frame = JSON.parse(message); } catch {}
      if (frame?.type === "Transition" && Array.isArray(frame.modifications)) {
        let touched = false;
        for (const m of frame.modifications) {
          const sub = subs.get(m.queryId);
          if (m.type !== "QueryUpdated" || !sub) continue;
          const value = replacements(sub);
          if (value !== undefined) { m.value = value; touched = true; }
        }
        if (touched) { ws.send(JSON.stringify(frame)); return; }
      }
      ws.send(message);
    });
  });
}

const measured = {};
/** WCAG contrast of the rendered badge: computed text color vs its fill flattened over its ancestors. */
async function measureBadge(locator) {
  return locator.evaluate((badge) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const g = canvas.getContext("2d", { willReadFrequently: true });
    const rgba = (css) => {
      g.clearRect(0, 0, 1, 1);
      g.fillStyle = "#000";
      g.fillStyle = css;
      g.fillRect(0, 0, 1, 1);
      const [r, gg, b, a] = g.getImageData(0, 0, 1, 1).data;
      return [r, gg, b, a / 255];
    };
    const over = (t, b) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3])).concat(1);
    const lum = (c) => {
      const l = c.slice(0, 3).map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
    };
    const el = badge.closest('[data-slot="badge"]') ?? badge;
    const chain = [];
    for (let n = el; n; n = n.parentElement) chain.push(n);
    let bg = [255, 255, 255, 1];
    for (const n of chain.reverse()) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) bg = over(c, bg);
    }
    const fg = rgba(getComputedStyle(el).color);
    const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  });
}

async function cropAround(page, locator, file, padX = 140, padY = 14) {
  measured[file] = await measureBadge(locator);
  const box = await locator.boundingBox();
  if (!box) throw new Error(`no box for ${file}`);
  const vp = page.viewportSize();
  const x = Math.max(0, box.x - padX);
  const y = Math.max(0, box.y - padY);
  const width = Math.min(vp.width - x, box.width + padX * 2);
  const height = Math.min(vp.height - y, box.height + padY * 2);
  await page.screenshot({ path: path.join(out, file), clip: { x, y, width, height } });
  console.log(`  ${file}`);
}

const browser = await chromium.launch();
try {
  for (const c of CASES) {
    const user = asUser(c.owner, "user:currentUser", {});
    const detail = asUser(c.owner, "tierLists:getDetail", { tierListId: c.list });
    const feeds = new Map([12, 32, 48].map((limit) => [limit, asUser(c.owner, "tierLists:listPublicFeed", { limit })]));
    const replacements = (sub) => {
      if (sub.udfPath === "user:currentUser") return user;
      if (sub.udfPath === "tierLists:getDetail" && sub.args?.tierListId === c.list) return detail;
      if (sub.udfPath === "tierLists:listPublicFeed") return feeds.get(sub.args?.limit ?? 12) ?? feeds.get(48);
      return undefined;
    };
    for (const p of PINS) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: p.mode, reducedMotion: "reduce" });
      await proxy(context, replacements);
      await context.addInitScript(pin, p);
      const page = await context.newPage();
      const tag = `${c.status}__${p.theme}__${p.mode}`;

      await page.goto(`http://localhost:${PORT}/community/tier-lists/${c.list}`);
      const detailBadge = page.locator(`text=${c.badge} >> visible=true`).first();
      await detailBadge.waitFor({ timeout: 120_000 });
      await page.waitForTimeout(1500);
      await cropAround(page, detailBadge, `detail-${tag}.png`);

      await page.goto(`http://localhost:${PORT}/community/tier-lists`);
      const card = page.locator('[data-slot="card"]', { hasText: c.title }).first();
      await card.waitFor({ timeout: 120_000 });
      const cardBadge = card.locator(`text=${c.badge}`).first();
      await cardBadge.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
      await cropAround(page, cardBadge, `card-${tag}.png`, 30, 14);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({ label, blockedWrites: blocked, renderedContrast: measured }, null, 2));
console.log(`blocked writes: ${JSON.stringify(blocked)}`);
console.log(JSON.stringify(measured, null, 1));
```
