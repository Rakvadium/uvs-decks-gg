# #232 probe scripts (read-only)

Put these files in a gitignored folder such as `scripts/probe-232/`, then run `node scripts/probe-232/capture.mjs <label>` against `next dev -p 8127` on a seeded validation backend. The proxy drops every Mutation/Action frame and rewrites only the browser's `user:currentUser` result to the seeded owner of the `alice-public` deck. Nothing is written.

## lib.mjs

```js
// Throwaway, gitignored (/scripts/*). Read-only probe for issue #232.
import { createRequire } from "node:module";
const require = createRequire(new URL("../../package.json", import.meta.url));
export const { chromium } = require("playwright");
export const sharp = require("sharp");
export const gifenc = require("gifenc");

export const DECK = "nh7f0kqdg3hwnpjpmga3tavb5sx4nzwf"; // seeded alice-public "Radiant Tempo"
export const OWNER = "r179d1q0sfe7zryjdrt7n907v86pt04s"; // seeded alice
const FAKE_USER = { _id: OWNER, _creationTime: 1790812800000, username: "alice-validation", email: "alice@validation.invalid" };

/** Proxies the Convex sync socket: drops Mutation/Action frames, rewrites user:currentUser to the deck owner (read-only override). */
export async function proxy(target, log) {
  await target.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
    const server = ws.connectToServer();
    const currentUserIds = new Set();
    ws.onMessage((message) => {
      let frame = null;
      try { frame = JSON.parse(message); } catch {}
      if (frame?.type === "Mutation" || frame?.type === "Action") { log.blocked.push(`${frame.type}:${frame.udfPath}`); return; }
      if (frame?.type === "ModifyQuerySet") {
        for (const m of frame.modifications ?? []) if (m.type === "Add" && m.udfPath === "user:currentUser") currentUserIds.add(m.queryId);
      }
      server.send(message);
    });
    server.onMessage((message) => {
      let frame = null;
      try { frame = JSON.parse(message); } catch {}
      if (frame?.type === "Transition" && Array.isArray(frame.modifications)) {
        let touched = false;
        for (const m of frame.modifications) {
          if (m.type === "QueryUpdated" && currentUserIds.has(m.queryId)) { m.value = FAKE_USER; touched = true; log.overrides++; }
        }
        if (touched) { ws.send(JSON.stringify(frame)); return; }
      }
      ws.send(message);
    });
  });
}

export function pinAppearance({ theme, mode }) {
  const apply = (root) => {
    if (root.getAttribute("data-color-theme") !== theme) root.setAttribute("data-color-theme", theme);
    if (root.classList.contains("dark") !== (mode === "dark")) root.classList.toggle("dark", mode === "dark");
    if (root.style.colorScheme !== mode) root.style.colorScheme = mode;
  };
  const start = () => {
    const root = document.documentElement; if (!root) return false;
    apply(root);
    new MutationObserver(() => apply(root)).observe(root, { attributes: true, attributeFilter: ["class", "style", "data-color-theme"] });
    return true;
  };
  if (!start()) new MutationObserver((_, o) => { if (start()) o.disconnect(); }).observe(document, { childList: true });
}

export const VIEWPORTS = { desktop: { width: 1280, height: 800, mobile: false }, mobile: { width: 390, height: 844, mobile: true } };

export async function newPage(browser, { viewport, theme, mode, log, scale, video }) {
  const vp = VIEWPORTS[viewport];
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: scale ?? (vp.mobile ? 2 : 1),
    isMobile: vp.mobile, hasTouch: vp.mobile, colorScheme: mode, reducedMotion: video ? "no-preference" : "reduce",
  });
  await proxy(context, log);
  await context.addInitScript(pinAppearance, { theme, mode });
  const page = await context.newPage();
  return { context, page };
}

/** DOM facts about the dialog(s): how many, which are aria-hidden (self or ancestor), where focus is. */
export async function dialogFacts(page) {
  return page.evaluate(() => {
    const hiddenBy = (el) => {
      for (let n = el; n && n !== document; n = n.parentElement) {
        if (n.getAttribute?.("aria-hidden") === "true") return n.tagName.toLowerCase() + (n.dataset?.slot ? `[data-slot=${n.dataset.slot}]` : "");
      }
      return null;
    };
    const dialogs = [...document.querySelectorAll('[role="dialog"],[role="alertdialog"]')].map((d) => ({
      role: d.getAttribute("role"),
      slot: d.dataset.slot ?? null,
      title: d.getAttribute("aria-labelledby") ? document.getElementById(d.getAttribute("aria-labelledby"))?.textContent ?? null : null,
      state: d.dataset.state ?? null,
      ariaHiddenBy: hiddenBy(d),
      visible: (() => { const r = d.getBoundingClientRect(); const s = getComputedStyle(d); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; })(),
      containsFocus: d.contains(document.activeElement),
    }));
    const ae = document.activeElement;
    return {
      dialogs,
      editTitles: [...document.querySelectorAll('[data-slot="dialog-title"]')].filter((t) => t.textContent === "Edit deck details").length,
      activeElement: ae ? { tag: ae.tagName.toLowerCase(), id: ae.id || null, label: ae.getAttribute("aria-label") || ae.textContent?.trim().slice(0, 40) || null } : null,
    };
  });
}

export function editTrigger(page, viewport) {
  return viewport === "desktop"
    ? page.locator("main, body").getByRole("button", { name: /^edit$/i })
    : page.getByRole("button", { name: "Edit deck details" });
}
```

## capture.mjs

```js
// Read-only before/after capture for #232. Usage: node capture.mjs <label>
import fs from "node:fs";
import path from "node:path";
import { chromium, newPage, DECK, dialogFacts, editTrigger, sharp, gifenc } from "./lib.mjs";

const label = process.argv[2];
if (!label) throw new Error("label required");
const port = process.env.PORT ?? "8127";
const out = path.resolve(new URL("../../.pr-captures/232/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), label);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const log = { blocked: [], overrides: 0 };
const browser = await chromium.launch();

const catalog = new Map();
async function serveCatalog(context) {
  await context.route(/\/catalog\/.+\.json\.gz$/, async (route) => {
    const url = route.request().url();
    if (!catalog.has(url)) catalog.set(url, fetch(url, { signal: AbortSignal.timeout(30000) }).then(async (r) => ({ status: r.status, body: Buffer.from(await r.arrayBuffer()) })));
    let got; try { got = await catalog.get(url); } catch (e) { console.log("catalog fail", e.message); catalog.delete(url); return route.abort().catch(() => {}); } const { status, body } = got;
    await route.fulfill({ status, body, contentType: "application/gzip", headers: { "access-control-allow-origin": "*" } }).catch(() => {});
  });
}

async function open(viewport, theme, mode, opts = {}) {
  const { context, page } = await newPage(browser, { viewport, theme, mode, log, ...opts });
  await serveCatalog(context);
  const t0 = Date.now();
  const step = (s) => console.log(`  [${viewport}/${theme}/${mode}] ${s} +${Date.now() - t0}ms`);
  await page.goto(`http://localhost:${port}/decks/${DECK}`);
  step("goto");
  const trigger = editTrigger(page, viewport).first();
  await trigger.waitFor({ timeout: 90_000 });
  step("trigger");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForFunction(() => ![...document.querySelectorAll('.animate-pulse, .animate-spin, [aria-busy="true"]')].some((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight; }), undefined, { timeout: 60_000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts.ready; await Promise.race([Promise.all([...document.images].filter((i) => { const b = i.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight; }).map((i) => i.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 10000))]); });
  await page.waitForTimeout(800);
  step("settled");
  return { context, page, trigger };
}

const freeze = (page) => page.addStyleTag({ content: "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important} nextjs-portal{display:none!important}" });

const a11y = {};
for (const viewport of ["desktop", "mobile"]) {
  for (const theme of ["default", "cyberpunk"]) {
    for (const mode of ["light", "dark"]) {
      const { context, page, trigger } = await open(viewport, theme, mode);
      await freeze(page);
      await trigger.click();
      await page.locator('[data-slot="dialog-content"][data-state="open"]').first().waitFor();
      await page.waitForTimeout(1200);
      const name = `edit-deck-dialog-open__${viewport}__${theme}__${mode}`;
      await page.screenshot({ path: path.join(out, `${name}.png`) });
      console.log(name);
      if (theme === "default" && mode === "dark") {
        const facts = await dialogFacts(page);
        const ariaSnapshot = await page.locator("body").ariaSnapshot();
        const dialogRoleCount = await page.getByRole("dialog").count();
        const editDialogCount = await page.getByRole("dialog", { name: "Edit deck details" }).count();
        // Focus trap: Tab many times, every focused element must be inside the open dialog.
        const tabEscapes = [];
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press("Tab");
          const inside = await page.evaluate(() => !!document.activeElement?.closest('[data-slot="dialog-content"][data-state="open"]'));
          if (!inside) tabEscapes.push(i);
        }
        await page.keyboard.press("Escape");
        await page.waitForTimeout(800);
        const afterEscape = await page.evaluate(() => ({
          openDialogs: document.querySelectorAll('[role="dialog"][data-state="open"]').length,
          ariaHiddenLeft: document.querySelectorAll('[aria-hidden="true"][data-aria-hidden]').length,
          active: document.activeElement ? (document.activeElement.getAttribute("aria-label") || document.activeElement.textContent?.trim().slice(0, 40) || document.activeElement.tagName) : null,
        }));
        const focusReturnedToTrigger = await trigger.evaluate((el) => el === document.activeElement);
        // Close button path too.
        await trigger.click();
        await page.locator('[data-slot="dialog-content"][data-state="open"]').first().waitFor();
        await page.waitForTimeout(600);
        const closeButtonInA11yTree = await page.getByRole("button", { name: "Close" }).count();
        await page.locator('[data-slot="dialog-content"][data-state="open"] [data-slot="dialog-close"]').last().click({ timeout: 10_000 });
        await page.waitForTimeout(800);
        const focusReturnedAfterCloseButton = await trigger.evaluate((el) => el === document.activeElement);
        a11y[viewport] = { getByRoleDialog: dialogRoleCount, getByRoleDialogEditDeckDetails: editDialogCount, dom: facts, focusTrapEscapesOnTab: tabEscapes, afterEscape, closeButtonInA11yTree, focusReturnedToTrigger, focusReturnedAfterCloseButton, ariaSnapshot };
        fs.writeFileSync(path.join(out, `a11y__${viewport}.yaml`.replace(".yaml", ".md")), "```yaml\n" + ariaSnapshot + "\n```\n");
      }
      await context.close();
    }
  }
}
fs.writeFileSync(path.join(out, "a11y.json"), JSON.stringify(a11y, null, 2));

// GIF: keyboard-only open (Enter), tab inside, close (Escape), desktop default dark.
{
  const { context, page, trigger } = await open("desktop", "default", "dark", { scale: 1, video: true });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const frames = [];
  let recording = true;
  const loop = (async () => { while (recording) frames.push({ png: await page.screenshot(), at: Date.now() }); })();
  await page.waitForTimeout(700);
  await trigger.focus();
  await page.waitForTimeout(700);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  for (let i = 0; i < 3; i++) { await page.keyboard.press("Tab"); await page.waitForTimeout(450); }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1300);
  recording = false;
  await loop;
  const { GIFEncoder, applyPalette, quantize } = gifenc;
  const gif = GIFEncoder();
  let pending = null, size = null;
  const flush = () => { if (!pending) return; const pal = quantize(pending.rgba, 256); gif.writeFrame(applyPalette(pending.rgba, pal), size.width, size.height, { palette: pal, delay: pending.delay }); };
  for (const [i, f] of frames.entries()) {
    const delay = i + 1 < frames.length ? frames[i + 1].at - f.at : 1500;
    const { data, info } = await sharp(f.png).resize({ width: 960 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    size = { width: info.width, height: info.height };
    if (pending && pending.rgba.equals(data)) { pending.delay += delay; continue; }
    flush(); pending = { rgba: data, delay };
  }
  flush(); gif.finish();
  fs.writeFileSync(path.join(out, "edit-deck-dialog-keyboard__desktop__default__dark.gif"), gif.bytes());
  console.log("gif frames", frames.length);
  await context.close();
}
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({ label, deck: DECK, override: "user:currentUser result rewritten to the seeded deck owner in the browser only", blockedConvexWrites: log.blocked, currentUserOverrides: log.overrides }, null, 2));
console.log("blocked writes:", log.blocked.length, "overrides:", log.overrides);
console.log(JSON.stringify(Object.fromEntries(Object.entries(a11y).map(([k, v]) => [k, { ...v, ariaSnapshot: undefined }])), null, 1));
await browser.close();
```

## repro.mjs

```js
import { chromium, newPage, DECK, dialogFacts, editTrigger } from "./lib.mjs";
const port = process.env.PORT ?? "8127";
const viewport = process.argv[2] ?? "desktop";
const log = { blocked: [], overrides: 0 };
const browser = await chromium.launch();
const { page } = await newPage(browser, { viewport, theme: "default", mode: "dark", log });
page.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text().slice(0, 200)); });
await page.goto(`http://localhost:${port}/decks/${DECK}`);
await page.waitForLoadState("networkidle").catch(() => {});
const buttons = await page.getByRole("button").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") || e.textContent.trim()).filter(Boolean));
console.log("buttons:", buttons.join(" | "));
const edit = editTrigger(page, viewport);
await edit.first().waitFor({ timeout: 60000 });
console.log("edit triggers:", await edit.count());
await edit.first().click();
await page.waitForTimeout(1000);
console.log(JSON.stringify(await dialogFacts(page), null, 1));
const snap = await page.locator("body").ariaSnapshot();
console.log("aria-snapshot dialogs:", (snap.match(/- dialog/g) ?? []).length);
console.log("blocked", log.blocked, "overrides", log.overrides);
await browser.close();
```

## diverge.mjs

```js
import { chromium, newPage, DECK, editTrigger } from "./lib.mjs";
const port = process.env.PORT ?? "8127";
const viewport = process.argv[2] ?? "desktop";
const log = { blocked: [], overrides: 0 };
const browser = await chromium.launch();
const { page } = await newPage(browser, { viewport, theme: "default", mode: "dark", log });
await page.goto(`http://localhost:${port}/decks/${DECK}`);
const edit = editTrigger(page, viewport);
await edit.first().waitFor({ timeout: 60000 });
const pre = await page.evaluate(() => {
  // Before opening: how many DeckDetailsPage-rooted host subtrees exist, and where are their DOM nodes?
  const views = [...document.querySelectorAll("*")].filter((el) => el.textContent && el.children.length >= 0);
  return { mains: document.querySelectorAll("main").length, deckTitles: [...document.querySelectorAll("h1,h2")].map((h) => h.textContent.trim()).slice(0, 10) };
});
console.log("pre", JSON.stringify(pre));
await edit.first().click();
await page.waitForTimeout(1000);
const info = await page.evaluate(() => {
  const fiberOf = (el) => el[Object.keys(el).find((k) => k.startsWith("__reactFiber"))];
  const nm = (f) => { const t = f.type; return typeof t === "function" ? (t.displayName || t.name || "anon") : typeof t === "string" ? t : t?.$$typeof?.toString?.() ?? `tag${f.tag}`; };
  const chain = (f) => { const out = []; while (f) { out.push(f); f = f.return; } return out.reverse(); };
  const els = [...document.querySelectorAll('[data-slot="dialog-content"]')];
  const [a, b] = els.map((e) => chain(fiberOf(e)));
  let i = 0;
  while (i < a.length && i < b.length && (a[i] === b[i] || a[i].alternate === b[i])) i++;
  const ctx = a.slice(Math.max(0, i - 12), i).map((f) => `${nm(f)}${f.key != null ? "#" + f.key : ""}${f.memoizedProps?.mode ? "{mode=" + f.memoizedProps.mode + "}" : ""}`);
  const divA = a.slice(i, i + 8).map((f) => `${nm(f)}${f.key != null ? "#" + f.key : ""}${f.memoizedProps?.mode ? "{mode=" + f.memoizedProps.mode + "}" : ""}`);
  const divB = b.slice(i, i + 8).map((f) => `${nm(f)}${f.key != null ? "#" + f.key : ""}${f.memoizedProps?.mode ? "{mode=" + f.memoizedProps.mode + "}" : ""}`);
  // Host DOM of each DeckDetailsView instance
  const viewHost = (ch) => { const idx = ch.findIndex((f) => nm(f) === "DeckDetailsView"); let f = ch[idx]; let c = f.child; while (c && typeof c.type !== "string") c = c.child; if (!c) return null; const el = c.stateNode; const s = getComputedStyle(el); let hidden = null; for (let n = el; n; n = n.parentElement) if (getComputedStyle(n).display === "none") { hidden = n.tagName + "." + n.className.slice(0, 60); break; } return { tag: el.tagName, cls: el.className.slice(0, 80), display: s.display, hiddenAncestor: hidden, connected: el.isConnected }; };
  return { commonDepth: i, common: ctx, divA, divB, hostA: viewHost(a), hostB: viewHost(b) };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
```
