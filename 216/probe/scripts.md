# #216 measurement scripts

Run with Node 22 from a scratch folder; Playwright and culori come from the repo's node_modules. `lib.mjs` reads synthetic local agent credentials from an `agent.env` next to it (not published). Every probe context drops Convex Mutation/Action frames and rewrites `sessions:getSession`, `user:currentUser` (role Admin) and `tierLists:getDetail` (canEdit) in the browser only.

## lib.mjs

```js
// Shared browser helpers for the #216 probes. Playwright comes from the repo's node_modules.
// Every context proxies the Convex sync socket: Mutation/Action frames are dropped, and query
// results can be rewritten browser-side (session pin, admin role, canEdit). Nothing is written.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const REPO = "C:/Projects/uvs-decks-gg/.claude/worktrees/agent-afb780430de899cb3";
const require = createRequire(path.join(REPO, "package.json"));
export const { chromium } = require("playwright");

const env = {};
for (const line of fs.readFileSync(new URL("./agent.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0) env[line.slice(0, i)] = line.slice(i + 1);
}

const SYNC = /\/api\/[^/]+\/sync$/;
const udf = (p) => (p ?? "").replace(/\.js:/, ":");

/**
 * rewrites: { "user:currentUser": (value) => value, ... }
 */
export async function proxy(target, { blocked, rewrites = {}, seen }) {
  await target.routeWebSocket(SYNC, (ws) => {
    const server = ws.connectToServer();
    const queries = new Map();
    let chunks = [];
    ws.onMessage((message) => {
      let frame = null;
      try { frame = typeof message === "string" ? JSON.parse(message) : null; } catch {}
      if (frame?.type === "Mutation" || frame?.type === "Action") {
        blocked.push(`${frame.type}:${frame.udfPath}`);
        return;
      }
      if (frame?.type === "ModifyQuerySet") {
        for (const m of frame.modifications ?? []) {
          if (m.type === "Add") queries.set(m.queryId, udf(m.udfPath));
          else if (m.type === "Remove") queries.delete(m.queryId);
        }
      }
      server.send(message);
    });
    const patch = (t) => {
      for (const m of t.modifications ?? []) {
        const name = queries.get(m.queryId);
        if (name && seen) seen.add(name);
        if (m.type === "QueryUpdated" && name && rewrites[name]) m.value = rewrites[name](m.value);
      }
      return JSON.stringify(t);
    };
    server.onMessage((message) => {
      if (typeof message !== "string") return ws.send(message);
      let frame = null;
      try { frame = JSON.parse(message); } catch {}
      if (frame?.type === "Transition") return ws.send(patch(frame));
      if (frame?.type === "TransitionChunk") {
        chunks.push(frame.chunk);
        if (chunks.length < frame.totalParts) return;
        const whole = JSON.parse(chunks.join(""));
        chunks = [];
        return ws.send(patch(whole));
      }
      ws.send(message);
    });
  });
}

function pinDom({ theme, mode }) {
  const apply = (root) => {
    if (theme && root.getAttribute("data-color-theme") !== theme) root.setAttribute("data-color-theme", theme);
    if (root.getAttribute("data-chrome") !== "calm") root.setAttribute("data-chrome", "calm");
    if (root.classList.contains("dark") !== (mode === "dark")) root.classList.toggle("dark", mode === "dark");
    if (root.style.colorScheme !== mode) root.style.colorScheme = mode;
  };
  const start = () => {
    const root = document.documentElement;
    if (!root) return false;
    apply(root);
    new MutationObserver(() => apply(root)).observe(root, { attributes: true, attributeFilter: ["class", "style", "data-color-theme", "data-chrome"] });
    return true;
  };
  if (!start()) new MutationObserver((_, o) => { if (start()) o.disconnect(); }).observe(document, { childList: true });
}

const catalogCache = new Map();
async function allowCatalog(context) {
  await context.route(/\/catalog\/.+\.json\.gz$/, async (route) => {
    const url = route.request().url();
    if (!catalogCache.has(url)) {
      catalogCache.set(url, fetch(url).then(async (r) => ({ status: r.status, body: Buffer.from(await r.arrayBuffer()) })).catch((e) => { catalogCache.delete(url); throw e; }));
    }
    try {
      const { status, body } = await catalogCache.get(url);
      await route.fulfill({ status, body, contentType: "application/gzip", headers: { "access-control-allow-origin": "*" } });
    } catch { await route.abort("failed").catch(() => {}); }
  });
}

export async function login(browser, base, blocked) {
  const context = await browser.newContext();
  await proxy(context, { blocked });
  await allowCatalog(context);
  const page = await context.newPage();
  await page.goto(`${base}/agent-login?token=${encodeURIComponent(env.AGENT_AUTH_SECRET)}&next=/decks`, { timeout: 180000 }).catch(() => {
    throw new Error("agent login navigation failed");
  });
  await page.waitForURL((u) => !u.pathname.startsWith("/agent-login"), { timeout: 120000 }).catch(() => {
    throw new Error(`agent login stuck on ${new URL(page.url()).pathname}`);
  });
  const state = await context.storageState();
  await context.close();
  return state;
}

/**
 * appearance: { theme, mode } for presets, or { custom: {light:{primary,secondary}, dark:{...}}, mode }.
 */
export async function newContext(browser, { base, appearance, storageState, blocked, seen, viewport = { width: 1280, height: 800 }, extraRewrites = {} }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: appearance.mode, reducedMotion: "reduce", storageState });
  const colorSource = appearance.custom
    ? { kind: "custom", custom: { fallback: appearance.custom } }
    : { kind: "preset", preset: appearance.theme };
  const rewrites = {
    "sessions:getSession": (v) => ({ ...(v ?? { _id: "pinned", _creationTime: 0, userId: "pinned", lastActiveAt: 0 }), theme: appearance.mode, chrome: "calm", colorSource }),
    "user:currentUser": (v) => (v ? { ...v, role: "Admin" } : v),
    ...extraRewrites,
  };
  await proxy(context, { blocked, rewrites, seen });
  await allowCatalog(context);
  await context.addInitScript(pinDom, { theme: appearance.custom ? "custom" : appearance.theme, mode: appearance.mode });
  await context.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important} nextjs-portal{display:none!important}";
    const add = () => (document.head ? document.head.appendChild(s) : requestAnimationFrame(add));
    add();
  });
  const page = await context.newPage();
  return { context, page };
}

export const THEMES = ["default", "calm-storm", "cyberpunk", "cotton-candy", "caffeine", "aurora", "sorbet", "singularity"];
export const MODES = ["light", "dark"];

// Runs in the page: resolve CSS colors to 8-bit sRGB by painting them on a canvas over the
// element's background stack, then WCAG contrast.
export const PAGE_HELPERS = `
window.__a11y = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const x = cv.getContext('2d', { willReadFrequently: true });
  const paint = (layers) => { x.clearRect(0,0,1,1); x.fillStyle = '#fff'; x.fillRect(0,0,1,1); for (const c of layers) { x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0,0,1,1); } const d = x.getImageData(0,0,1,1).data; return [d[0], d[1], d[2]]; };
  const stack = (el) => { const s = []; for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') s.unshift(b); } return s; };
  const lum = ([r,g,b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b); };
  const ratio = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A,B) + 0.05) / (Math.min(A,B) + 0.05); };
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  // text color vs element's own composited bg
  const text = (el) => { const bg = paint(stack(el)); const fg = paint([...stack(el), getComputedStyle(el).color]); return { fg: hex(fg), bg: hex(bg), ratio: +ratio(fg, bg).toFixed(2), css: getComputedStyle(el).color, bgCss: getComputedStyle(el).backgroundColor }; };
  // border (top) vs the element's own fill and vs the surface behind the element
  const border = (el) => { const own = stack(el); const parent = stack(el.parentElement); const bc = getComputedStyle(el).borderTopColor; const b = paint([...own, bc]); const fill = paint(own); const surf = paint(parent); return { border: hex(b), fill: hex(fill), surface: hex(surf), vsFill: +ratio(b, fill).toFixed(2), vsSurface: +ratio(b, surf).toFixed(2), css: bc }; };
  return { text, border, paint, stack, ratio, hex };
})();
`;
```

## probe.mjs

```js
// #216 contrast probe: real components, real CSS, every palette x mode. Browser-side only:
// Convex writes are dropped and admin/canEdit/session are rewritten in the browser.
// Usage: node probe.mjs <base> <outDir> [presets|custom]
import fs from "node:fs";
import path from "node:path";
import { chromium, login, newContext, THEMES, MODES, PAGE_HELPERS } from "./lib.mjs";

const [base, outDir, kind = "presets"] = process.argv.slice(2);
fs.mkdirSync(path.join(outDir, "crops"), { recursive: true });
const TIER = "community/tier-lists/qs79cym6q521fdqc7c9qjf7dcqc27a3k";
export const CUSTOM = {
  "default-brand": { light: { primary: "#ff5000", secondary: "#272b27" }, dark: { primary: "#ff5000", secondary: "#272b27" } },
  "teal-cream": { light: { primary: "#00b3a4", secondary: "#f4f1e8" }, dark: { primary: "#00b3a4", secondary: "#0f1f1d" } },
  "deep-purple": { light: { primary: "#4c1d95", secondary: "#ede4f7" }, dark: { primary: "#7c3aed", secondary: "#140b22" } },
  "pale-yellow": { light: { primary: "#f5e663", secondary: "#ffffff" }, dark: { primary: "#f5e663", secondary: "#000000" } },
};
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const targets = kind === "custom" ? Object.keys(CUSTOM) : THEMES;

const blocked = [];
const browser = await chromium.launch();
const results = [];

async function tag(page, locator, name) {
  await locator.first().waitFor({ timeout: 30000 });
  await locator.first().evaluate((el, n) => el.setAttribute("data-a11y", n), name);
  return page.locator(`[data-a11y="${name}"]`);
}

// Forced :hover only lasts while the CDP session stays attached, so keep one per page.
const cdps = new WeakMap();
async function forceHover(page, name, on) {
  let cdp = cdps.get(page);
  if (!cdp) {
    cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    cdps.set(page, cdp);
  }
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: `[data-a11y="${name}"]` });
  await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: on ? ["hover"] : [] });
  await page.waitForTimeout(200);
}

const measure = (loc, fn) => loc.evaluate((el, f) => window.__a11y[f](el), fn);

async function crop(loc, file, pad = 8) {
  const box = await loc.boundingBox();
  if (!box) return;
  await loc.page().screenshot({ path: file, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 } });
}

for (const target of targets) {
  if (only && !only.includes(target)) continue;
  for (const mode of MODES) {
    let row;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      row = await runRow(target, mode).catch((error) => ({ id: `${target}__${mode}`, target, mode, error: String(error).split("\n")[0] }));
      if (!row.error) break;
      console.log(`${row.id} attempt ${attempt + 1} failed: ${row.error}`);
    }
    results.push(row);
    console.log(row.id, row.error ?? "ok", row.btnRest?.ratio, row.actRest?.ratio, row.cbRest?.vsFill, row.secBadge?.ratio);
  }
}

async function runRow(target, mode) {
    const id = `${target}__${mode}`;
    const appearance = kind === "custom" ? { custom: CUSTOM[target], mode } : { theme: target, mode };
    const row = { id, target, mode };
    const storageState = await login(browser, base, blocked);
    const { context, page } = await newContext(browser, {
      base, appearance, storageState, blocked,
      extraRewrites: { "tierLists:getDetail": (v) => (v ? { ...v, canEdit: true } : v) },
    });
    await context.addInitScript(PAGE_HELPERS);
    const shot = (name) => path.join(outDir, "crops", `${name}__${id}.png`);
    const waitTheme = async () => {
      if (kind === "custom") await page.waitForFunction(() => (document.getElementById("appearance-custom-vars")?.textContent ?? "").includes("--destructive"), null, { timeout: 30000 }).catch(() => { row.customStyleMissing = true; });
    };
    try {
      // 1. Destructive Button on the real /admin/ui-matrix (admin role rewritten in the browser).
      await page.goto(`${base}/admin/ui-matrix`);
      await waitTheme();
      const btn = await tag(page, page.locator("button[data-slot=button]", { hasText: /^destructive$/ }), "btn");
      await page.waitForTimeout(500);
      row.btnRest = await measure(btn, "text");
      row.btnBorder = await measure(btn, "border");
      await crop(btn, shot("button-rest"));
      await forceHover(page, "btn", true);
      row.btnHover = await measure(btn, "text");
      await crop(btn, shot("button-hover"));
      await forceHover(page, "btn", false);
      // text-destructive on the page (unchanged-token control) and the destructive badge recipe.
      row.destText = await page.evaluate(() => {
        const host = document.querySelector("main") ?? document.body;
        const wrap = document.createElement("div");
        wrap.innerHTML = '<span id="a11y-dt" class="text-destructive text-sm">destructive text</span> <span id="a11y-db" class="inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-destructive-selected text-destructive border-destructive-soft">badge</span>';
        host.prepend(wrap);
        return { text: window.__a11y.text(document.getElementById("a11y-dt")), badge: window.__a11y.text(document.getElementById("a11y-db")) };
      });
      // vars as the page sees them
      row.vars = await page.evaluate(() => {
        const s = getComputedStyle(document.documentElement);
        const names = ["--destructive", "--destructive-fill", "--destructive-foreground", "--background", "--foreground", "--checkbox-border", "--checkbox-border-hover"];
        return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n).trim()]));
      });

      // 2. Tier-list delete confirm (AlertDialogAction), canEdit rewritten; Delete is never clicked.
      await page.goto(`${base}/${TIER}`);
      await waitTheme();
      await page.locator("button[data-slot=button]", { hasText: /^Edit$/ }).first().click();
      await page.locator("button[data-slot=button]", { hasText: /^Delete$/ }).first().click();
      const dialog = page.locator("[role=alertdialog]");
      await dialog.waitFor();
      const act = await tag(page, dialog.locator("button", { hasText: /^Delete$/ }), "act");
      await page.waitForTimeout(400);
      row.actRest = await measure(act, "text");
      row.actBorder = await measure(act, "border");
      const footer = act.locator("xpath=..");
      await crop(act, shot("alert-rest"), 10);
      await forceHover(page, "act", true);
      row.actHover = await measure(act, "text");
      await crop(act, shot("alert-hover"), 10);
      await forceHover(page, "act", false);
      await page.keyboard.press("Escape");

      // 3. Checkbox in the gallery filter panel (sets).
      await page.goto(`${base}/gallery`);
      await waitTheme();
      await page.locator('[aria-label="Toggle filter panel"]:visible').first().click();
      const cbLoc = page.locator('[data-slot=checkbox][data-state=unchecked]');
      const cb = await tag(page, cbLoc, "cb");
      await cb.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const cbRow = cb.locator("xpath=..");
      row.cbRest = await measure(cb, "border");
      await crop(cb, shot("checkbox-rest"), 8);
      await forceHover(page, "cb", true);
      row.cbHover = await measure(cb, "border");
      await crop(cb, shot("checkbox-hover"), 8);
      await forceHover(page, "cb", false);
      await cb.evaluate((el) => el.setAttribute("aria-invalid", "true"));
      await page.waitForTimeout(150);
      row.cbInvalid = await measure(cb, "border");
      row.cbInvalid.destructive = await page.evaluate(() => window.__a11y.hex(window.__a11y.paint([getComputedStyle(document.documentElement).getPropertyValue("--destructive")])));
      await crop(cb, shot("checkbox-invalid"), 8);
      await cb.evaluate((el) => el.removeAttribute("aria-invalid"));
      await page.keyboard.press("Escape");

      // 4. Secondary badge: the admin page header count, real Badge variant="secondary".
      await page.goto(`${base}/admin/formats`);
      await waitTheme();
      const badge = await tag(page, page.locator("[data-slot=badge][class*=bg-secondary-selected]"), "sbadge");
      await page.waitForTimeout(500);
      row.secBadge = await measure(badge, "text");
      row.secBadgeBorder = await measure(badge, "border");
      await crop(badge, shot("badge-secondary"), 6);
    } catch (error) {
      row.error = String(error).split("\n")[0];
      await page.screenshot({ path: path.join(outDir, `error__${id}.png`) }).catch(() => {});
    }
    await context.close();
    return row;
}
fs.writeFileSync(path.join(outDir, "probe.json"), JSON.stringify({ base, kind, blocked: [...new Set(blocked)], blockedCount: blocked.length, results }, null, 2));
await browser.close();
```

## tokens.mjs

```js
// Token-math contrast for issue #216. Usage: node tokens.mjs <repoRoot>
// Parses src/styles/themes/*.css and evaluates the measured pairs in sRGB.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.argv[2];
const require = createRequire(path.join(root, "package.json"));
const culori = require("culori");
const { parse, converter, wcagContrast, formatHex, interpolate, clampChroma, displayable } = culori;
const toRgb = converter("rgb");
const toOklch = converter("oklch");

export const THEMES = ["default", "calm-storm", "cyberpunk", "cotton-candy", "caffeine", "aurora", "sorbet", "singularity"];

export function readTheme(theme) {
  const css = fs.readFileSync(path.join(root, "src/styles/themes", `${theme}.css`), "utf8");
  const blocks = { light: {}, dark: {}, lightOnly: {} };
  const re = /\[data-color-theme="([^"]+)"\](\.dark|:not\(\.dark\))?\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const mode = m[2] === ".dark" ? "dark" : m[2] ? "lightOnly" : "light";
    for (const decl of m[3].split(";")) {
      const i = decl.indexOf(":");
      if (i < 0) continue;
      const name = decl.slice(0, i).trim();
      const value = decl.slice(i + 1).trim();
      if (name.startsWith("--")) blocks[mode][name] = value;
    }
  }
  return blocks;
}

const ok = (s) => {
  const c = parse(s);
  if (!c) throw new Error(`unparsed ${s}`);
  return toOklch(c);
};

// CSS color-mix(in oklch, a p%, b) with powerless-hue handling and shorter hue.
export function mixOklch(a, b, p) {
  const A = { ...a }, B = { ...b };
  const achA = !A.c || A.c < 1e-6, achB = !B.c || B.c < 1e-6;
  if (achA) A.h = achB ? 0 : B.h;
  if (achB) B.h = A.h;
  let ha = A.h ?? 0, hb = B.h ?? 0;
  let d = hb - ha;
  if (d > 180) ha += 360;
  else if (d < -180) hb += 360;
  const q = 1 - p;
  // premultiplied alpha omitted (all opaque)
  return { mode: "oklch", l: A.l * p + B.l * q, c: (A.c ?? 0) * p + (B.c ?? 0) * q, h: ((ha * p + hb * q) % 360 + 360) % 360, alpha: 1 };
}

// Composite fg (alpha) over opaque bg in sRGB (what the browser does for color-mix with transparent? see note).
export function over(fg, alpha, bg) {
  const f = toRgb(fg), b = toRgb(bg);
  const clamp = (x) => Math.min(1, Math.max(0, x));
  return { mode: "rgb", r: clamp(f.r) * alpha + clamp(b.r) * (1 - alpha), g: clamp(f.g) * alpha + clamp(b.g) * (1 - alpha), b: clamp(f.b) * alpha + clamp(b.b) * (1 - alpha) };
}

export const cr = (a, b) => {
  const clip = (c) => { const r = toRgb(c); return { mode: "rgb", r: Math.min(1, Math.max(0, r.r)), g: Math.min(1, Math.max(0, r.g)), b: Math.min(1, Math.max(0, r.b)) }; };
  return wcagContrast(clip(a), clip(b));
};

export function pairs(theme, mode, vars) {
  const v = (n) => ok(vars[n]);
  const bg = v("--background"), card = v("--card"), pop = v("--popover"), fg = v("--foreground");
  const white = ok("#fff");
  const dest = v("--destructive");
  const destFg = ok(vars["--destructive-foreground"]);
  const out = {};
  out.destBtn = cr(destFg, dest);
  out.destAlertFg = cr(fg, dest);
  // hover fill = destructive/90 over the surface behind it (popover for dialogs, background for buttons)
  out.destBtnHover = cr(destFg, over(dest, 0.9, bg));
  out.destAlertHover = cr(destFg, over(dest, 0.9, pop));
  out.destTextBg = cr(dest, bg);
  out.destTextPop = cr(dest, pop);
  out.destBadge = cr(dest, over(dest, 0.2, bg));
  // checkbox
  const p = v("--primary"), s = v("--secondary"), border = v("--border");
  const dualMix = mixOklch(p, s, 0.5);
  const dual = mixOklch(dualMix, border, 0.62);
  const dualStrong = mixOklch(dualMix, border, 0.76);
  const mfg = v("--muted-foreground");
  if (mode === "light") {
    out.cbRest = cr(dual, bg);
    out.cbHover = cr(dualStrong, bg);
    out.cbRestColor = formatHex(dual);
  } else {
    out.cbRest = cr(over(mfg, 0.6, bg), bg);
    out.cbHover = cr(over(mfg, 0.8, bg), bg);
  }
  out.secBadge = cr(s, over(s, 0.2, bg));
  out.secBadgeVsBg = cr(s, bg);
  return out;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1].endsWith("tokens.mjs")) {
  const rows = [];
  for (const t of THEMES) {
    const b = readTheme(t);
    for (const mode of ["light", "dark"]) {
      const vars = { ...b.light, ...(mode === "dark" ? b.dark : b.lightOnly) };
      rows.push({ theme: t, mode, ...pairs(t, mode, vars) });
    }
  }
  const f = (x) => (typeof x === "number" ? x.toFixed(2) : x);
  console.log(["theme", "mode", ...Object.keys(rows[0]).slice(2)].join("\t"));
  for (const r of rows) console.log(Object.values(r).map(f).join("\t"));
}
```

## solve.mjs

```js
// Picks the minimum lightness shift per palette x mode (token math). Usage: node solve.mjs <repo>
import path from "node:path";
import { createRequire } from "node:module";
import { THEMES, readTheme, mixOklch, over, cr } from "./tokens.mjs";

const root = process.argv[2];
const require = createRequire(path.join(root, "package.json"));
const { parse, converter, clampChroma, formatHex } = require("culori");
const ok = (s) => converter("oklch")(parse(s));
const white = ok("#fff");
const f4 = (x) => +x.toFixed(4);
const fmt = (c) => `oklch(${f4(c.l)} ${f4(c.c)} ${+((c.h ?? 0).toFixed(3))})`;

const DEST_T = 4.55; // label target (token math; browser verified >= 4.5)
const CB_T = 3.05; // checkbox border target

const out = [];
for (const theme of THEMES) {
  const b = readTheme(theme);
  for (const mode of ["light", "dark"]) {
    const v = { ...b.light, ...(mode === "dark" ? b.dark : b.lightOnly) };
    const g = (n) => ok(v[n]);
    const bg = g("--background"), pop = g("--popover"), card = g("--card");
    const dest = g("--destructive");
    const row = { theme, mode };
    // destructive fill
    const score = (fill) => Math.min(cr(white, fill), cr(white, over(fill, 0.9, bg)), cr(white, over(fill, 0.9, pop)), cr(white, over(fill, 0.9, card)));
    row.destNow = +score(dest).toFixed(2);
    if (score(dest) >= 4.5) row.destFill = null;
    else {
      let l = dest.l, cand;
      for (;;) {
        l -= 0.0025;
        cand = clampChroma({ mode: "oklch", l, c: dest.c, h: dest.h }, "oklch");
        if (score(cand) >= DEST_T) break;
      }
      row.destFill = fmt(cand);
      row.destDL = f4(cand.l - dest.l);
      row.destDC = f4(cand.c - dest.c);
      row.destNew = +score(cand).toFixed(2);
      row.destHex = formatHex(cand) + " was " + formatHex(clampChroma(dest, "oklch"));
    }
    // checkbox (light: control-dual-border; dark: muted-foreground /60, hover /80)
    const p = g("--primary"), s = g("--secondary"), border = g("--border");
    const dualMix = mixOklch(p, s, 0.5);
    const surfaces = [bg, pop];
    const cbScore = (c) => Math.min(...surfaces.map((x) => cr(c, x)));
    if (mode === "light") {
      const rest = mixOklch(dualMix, border, 0.62);
      const hover = mixOklch(dualMix, border, 0.76);
      row.cbNow = [+cbScore(rest).toFixed(2), +cbScore(hover).toFixed(2)];
      if (cbScore(rest) >= 3 && cbScore(hover) >= cbScore(rest)) row.cb = null;
      else {
        let d = 0;
        while (cbScore({ ...rest, l: rest.l - d }) < CB_T) d += 0.005;
        const newRest = cbScore({ ...rest, l: rest.l - d });
        const want = newRest + Math.max(0.3, cbScore(hover) - cbScore(rest));
        let dh = 0;
        while (cbScore({ ...hover, l: hover.l - dh }) < want) dh += 0.005;
        row.cb = { restDL: f4(-d), hoverDL: f4(-dh), rest: +newRest.toFixed(2), hover: +cbScore({ ...hover, l: hover.l - dh }).toFixed(2) };
      }
    } else {
      const mfg = g("--muted-foreground");
      const at = (a) => over(mfg, a, bg);
      row.cbNow = [+cbScore(at(0.6)).toFixed(2), +cbScore(at(0.8)).toFixed(2)];
      row.cbLadder = Object.fromEntries([0.6, 0.8, 0.9, 1].map((a) => [a, +cbScore(at(a)).toFixed(2)]));
    }
    out.push(row);
  }
}
console.log(JSON.stringify(out, null, 1));
```

## solve-badge.mjs

```js
// Minimum L shift of --secondary (same c, h) so the secondary Badge text clears 4.5:1 on its own
// tint (tone/20) over background, card and popover. Usage: node solve-badge.mjs <repo> [theme]
import path from "node:path";
import { createRequire } from "node:module";
import { readTheme, over, cr } from "./tokens.mjs";
const root = process.argv[2];
const theme = process.argv[3] ?? "default";
const require = createRequire(path.join(root, "package.json"));
const { parse, converter, clampChroma, formatHex } = require("culori");
const ok = (s) => converter("oklch")(parse(s));
const b = readTheme(theme);
for (const mode of ["light", "dark"]) {
  const v = { ...b.light, ...(mode === "dark" ? b.dark : b.lightOnly) };
  const s = ok(v["--secondary"]);
  const surfaces = ["--background", "--card", "--popover"].map((n) => ok(v[n]));
  const score = (t) => Math.min(...surfaces.map((x) => cr(t, over(t, 0.2, x))));
  const border = (t) => Math.min(...surfaces.map((x) => cr(over(t, 0.4, x), x)));
  const dir = mode === "light" ? -1 : 1;
  let d = 0, c;
  for (;;) {
    c = clampChroma({ mode: "oklch", l: s.l + dir * d, c: s.c, h: s.h }, "oklch");
    if (score(c) >= 4.55) break;
    d += 0.005;
  }
  console.log(mode, "now", score(s).toFixed(2), "->", score(c).toFixed(2), `oklch(${c.l.toFixed(3)} ${c.c.toFixed(3)} ${c.h.toFixed(1)})`, formatHex(c), "dL", (dir * d).toFixed(3), "border", border(s).toFixed(2), "->", border(c).toFixed(2));
}
```

## grid.mjs

```js
// Builds one current-vs-proposed grid per element from the probe crops.
// Usage: node grid.mjs <baseDir> <afterDir> <outDir> <presets|custom>
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const REPO = "C:/Projects/uvs-decks-gg/.claude/worktrees/agent-afb780430de899cb3";
const require = createRequire(path.join(REPO, "package.json"));
const sharp = require("sharp");

const [baseDir, afterDir, outDir, kind = "presets"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const base = JSON.parse(fs.readFileSync(path.join(baseDir, "probe.json"), "utf8"));
const after = JSON.parse(fs.readFileSync(path.join(afterDir, "probe.json"), "utf8"));
const byId = (p) => Object.fromEntries(p.results.map((r) => [r.id, r]));
const B = byId(base), A = byId(after);

const ELEMENTS = [
  { name: "button-rest", title: "Button variant=destructive, rest", scale: 2, ratio: (r) => r.btnRest?.ratio, unit: ":1 label" },
  { name: "button-hover", title: "Button variant=destructive, hover", scale: 2, ratio: (r) => r.btnHover?.ratio, unit: ":1 label" },
  { name: "alert-rest", title: "Tier-list delete confirm (AlertDialogAction), rest", scale: 2, ratio: (r) => r.actRest?.ratio, unit: ":1 label" },
  { name: "alert-hover", title: "Tier-list delete confirm (AlertDialogAction), Delete hovered", scale: 2, ratio: (r) => r.actHover?.ratio, unit: ":1 label" },
  { name: "checkbox-rest", title: "Unchecked checkbox (gallery filter, sets), rest", scale: 6, ratio: (r) => r.cbRest?.vsFill, unit: ":1 border" },
  { name: "checkbox-hover", title: "Unchecked checkbox, hover", scale: 6, ratio: (r) => r.cbHover?.vsFill, unit: ":1 border" },
  { name: "checkbox-invalid", title: "Checkbox aria-invalid", scale: 6, ratio: (r) => r.cbInvalid?.vsFill, unit: ":1 border", note: (r) => (r.cbInvalid && r.cbInvalid.border === r.cbInvalid.destructive ? "destructive" : "NOT destructive") },
  { name: "badge-secondary", title: "Badge variant=secondary (admin header count)", scale: 3, ratio: (r) => r.secBadge?.ratio, unit: ":1 text" },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const text = (s, w, h, opts = {}) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${opts.bg ?? "#ffffff"}"/><text x="${opts.x ?? 6}" y="${h / 2 + 5}" font-family="Segoe UI, Arial, sans-serif" font-size="${opts.size ?? 14}" font-weight="${opts.weight ?? 400}" fill="${opts.fill ?? "#111"}">${esc(s)}</text></svg>`);

async function cell(file, scale) {
  if (!fs.existsSync(file)) return null;
  const meta = await sharp(file).metadata();
  return { buf: await sharp(file).resize(meta.width * scale, meta.height * scale, { kernel: "nearest" }).png().toBuffer(), w: meta.width * scale, h: meta.height * scale };
}

for (const el of ELEMENTS) {
  const ids = Object.keys(A);
  const rows = [];
  for (const id of ids) {
    const b = await cell(path.join(baseDir, "crops", `${el.name}__${id}.png`), el.scale);
    const a = await cell(path.join(afterDir, "crops", `${el.name}__${id}.png`), el.scale);
    rows.push({ id, b, a, rb: el.ratio(B[id] ?? {}), ra: el.ratio(A[id] ?? {}), nb: el.note?.(B[id] ?? {}), na: el.note?.(A[id] ?? {}) });
  }
  const cw = Math.max(...rows.flatMap((r) => [r.b?.w ?? 0, r.a?.w ?? 0])) + 130;
  const labelW = 200;
  const width = labelW + cw * 2;
  const heights = rows.map((r) => Math.max(r.b?.h ?? 0, r.a?.h ?? 0, 30) + 8);
  const headH = 64;
  const height = headH + heights.reduce((x, y) => x + y, 0);
  const composites = [
    { input: text(el.title, width, 32, { size: 16, weight: 600 }), left: 0, top: 0 },
    { input: text("palette / mode", labelW, 28, { weight: 600 }), left: 0, top: 34 },
    { input: text("current (dev)", cw, 28, { weight: 600 }), left: labelW, top: 34 },
    { input: text("proposed", cw, 28, { weight: 600 }), left: labelW + cw, top: 34 },
  ];
  let y = headH;
  rows.forEach((r, i) => {
    const h = heights[i];
    composites.push({ input: text(r.id.replace("__", " "), labelW, h, { bg: i % 2 ? "#f4f4f5" : "#ffffff" }), left: 0, top: y });
    for (const [j, c, ratio, note] of [[0, r.b, r.rb, r.nb], [1, r.a, r.ra, r.na]]) {
      const x = labelW + j * cw;
      composites.push({ input: text("", cw, h, { bg: i % 2 ? "#f4f4f5" : "#ffffff" }), left: x, top: y });
      if (c) composites.push({ input: c.buf, left: x + 4, top: y + Math.floor((h - c.h) / 2) });
      const pass = ratio === undefined ? "" : ratio >= (el.unit.includes("border") ? 3 : 4.5) ? "#15803d" : "#b91c1c";
      const label = ratio === undefined ? "n/a" : `${ratio.toFixed(2)}${el.unit.split(" ")[0]}${note ? ` ${note}` : ""}`;
      composites.push({ input: text(label, 124, h, { fill: pass || "#111", weight: 600, size: 13, bg: i % 2 ? "#f4f4f5" : "#ffffff" }), left: x + (c?.w ?? 0) + 6, top: y });
    }
    y += h;
  });
  await sharp({ create: { width, height, channels: 3, background: "#ffffff" } }).composite(composites).png({ palette: true }).toFile(path.join(outDir, `${el.name}.png`));
  console.log("grid", el.name, width, height);
}
```

## table.mjs

```js
// Before/after contrast table from two probe.json files. Usage: node table.mjs <base> <after> [pre201]
import fs from "node:fs";
import path from "node:path";
const [baseDir, afterDir, preDir] = process.argv.slice(2);
const load = (d) => Object.fromEntries(JSON.parse(fs.readFileSync(path.join(d, "probe.json"), "utf8")).results.map((r) => [r.id, r]));
const B = load(baseDir), A = load(afterDir), P = preDir ? load(preDir) : null;

const PAIRS = [
  ["Button label", (r) => r.btnRest?.ratio, 4.5],
  ["Button label, hover", (r) => r.btnHover?.ratio, 4.5],
  ["Confirm label", (r) => r.actRest?.ratio, 4.5],
  ["Confirm label, hover", (r) => r.actHover?.ratio, 4.5],
  ["Checkbox vs fill", (r) => r.cbRest?.vsFill, 3],
  ["Checkbox vs panel", (r) => r.cbRest?.vsSurface, 3],
  ["Checkbox hover vs fill", (r) => r.cbHover?.vsFill, 3],
  ["Checkbox hover vs panel", (r) => r.cbHover?.vsSurface, 3],
  ["Invalid checkbox", (r) => r.cbInvalid?.vsFill, 3, (r) => (r.cbInvalid?.border === r.cbInvalid?.destructive ? "" : " neutral")],
  ["Secondary badge text", (r) => r.secBadge?.ratio, 4.5],
  ["text-destructive (control)", (r) => r.destText?.text?.ratio, 4.5],
  ["Destructive badge text (control)", (r) => r.destText?.badge?.ratio, 4.5],
];

const regressions = [];
const cell = (b, a, min, nb = "", na = "") => {
  if (b === undefined && a === undefined) return "n/a";
  const f = (x, n) => (x === undefined ? "n/a" : `${x.toFixed(2)}${n}`);
  const mark = (x) => (x === undefined ? "" : x >= min ? "" : " ✗");
  if (b === a && nb === na) return `${f(a, na)}${mark(a)}`;
  return `${f(b, nb)}${mark(b)} → **${f(a, na)}**${mark(a)}`;
};
const lines = [];
lines.push(`| Palette | Mode | ${PAIRS.map((p) => p[0]).join(" | ")} |`);
lines.push(`|---|---|${PAIRS.map(() => "---").join("|")}|`);
for (const id of Object.keys(A)) {
  const b = B[id] ?? {}, a = A[id];
  const cells = PAIRS.map(([name, get, min, note]) => {
    const vb = get(b), va = get(a);
    if (vb !== undefined && va !== undefined && va < vb - 0.005) regressions.push(`${id} ${name}: ${vb} → ${va}`);
    if (note && note(b) && !note(a) && false) return "";
    return cell(vb, va, min, note?.(b) ?? "", note?.(a) ?? "");
  });
  lines.push(`| ${a.target} | ${a.mode} | ${cells.join(" | ")} |`);
}
const errors = Object.values({ ...B, ...A }).filter((r) => r.error).map((r) => `${r.id}: ${r.error}`);
console.log(lines.join("\n"));
console.log(`\nRegressions (proposed below current by more than 0.005): ${regressions.length ? regressions.join("; ") : "none"}`);
if (errors.length) console.log(`Probe errors: ${errors.join("; ")}`);
if (P) {
  console.log("\n| Custom palette | Mode | Confirm label, pre-#201 `7d98b4b` | `dev` | proposed | label colour pre-#201 / dev / proposed |");
  console.log("|---|---|---|---|---|---|");
  for (const id of Object.keys(A)) {
    const p = P[id] ?? {}, b = B[id] ?? {}, a = A[id];
    console.log(`| ${a.target} | ${a.mode} | ${p.actRest?.ratio ?? "n/a"} | ${b.actRest?.ratio ?? "n/a"} | ${a.actRest?.ratio ?? "n/a"} | ${p.actRest?.fg ?? "?"} / ${b.actRest?.fg ?? "?"} / ${a.actRest?.fg ?? "?"} |`);
  }
}
```
