# Round-3 pin probes (head 855b9fb)

Unit-level probes drive the real `scripts/pr-capture/pin.ts`. `shotPin` copies the logic of capture.ts's `shotPin` (it isn't exported; capture.ts runs main on import).

## Output

```
=== Regression (round 1 + round 2) ===
R1a subscribed, no result
    patched=false saved=null overridden=false problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R1b QueryResult instead of QueryUpdated
    patched=false saved=null overridden=false problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R1c TransitionV2 frame
    patched=false saved=null overridden=false problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R1d modifications renamed
    patched=false saved=null overridden=false problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-E1 pin==saved, no result
    patched=false saved=null overridden=false problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-E2 pin==saved, null
    patched=false saved=null overridden=false problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-E3 pin==saved, never subscribed
    patched=false saved=null overridden=false problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true
R2-E4 pin==saved, QueryFailed
    patched=false saved=null overridden=false problems=["sessions:getSession failed: boom","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-X2 reconnect, s2 result in TransitionV2
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-X3 second sub, no result
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-X4 second sub, QueryResult type
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-X5 later update renamed type
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2 binary frame after subscribe
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=["a binary sync frame was forwarded unpatched (protocol changed?)"] FLAGGED=true
R2 Transition without modifications
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)"] FLAGGED=true
CTRL clean + Ping (must NOT flag)
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=[] FLAGGED=false

=== Adversarial (round 3) ===
A1a good result lands after snapshot, before png
    patched=false saved=null overridden=false problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true  [conservative]
A1b null lands after snapshot, before png: that snapshot
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=[] FLAGGED=false
A1b ... any later snapshot
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true  [problem is sticky]
A2a GIF: mid-GIF null then good
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=["sessions:getSession returned null, so there was nothing to rewrite"] FLAGGED=true
A2b GIF: mid-GIF unknown type then good
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched"] FLAGGED=true
A2c GIF: mid-GIF Remove+Add, pending in middle, rewritten by last
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=[] FLAGGED=false  [middle report flagged=true; middle frames not consulted]
A2d GIF: mid-GIF skip (Remove only), then re-Add+rewrite
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=[] FLAGGED=false  [middle report: patched=false problems=[] flagged=false]
A3 two contexts: ctx A clean
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=[] FLAGGED=false
A3 two contexts: ctx B no result
    patched=false saved=null overridden=false problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
A3b ctx A second page/socket pending
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
A4 valid shape, other user's prefs
    patched=true saved=noir/light/calm overridden=true problems=[] FLAGGED=false  [forwarded = aurora/light/calm, userId=u9]
A5a provider never mounted (socket, no Add)
    patched=false saved=null overridden=false problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true
A5b no Convex socket at all
    patched=false saved=null overridden=false problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true
A6a client Remove (useQuery -> 'skip'), no re-Add before shot
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=[] FLAGGED=false
A6b server QueryRemoved, no re-Add before shot
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=[] FLAGGED=false
A6c Add then Remove before any result
    patched=false saved=null overridden=false problems=[] FLAGGED=false
A6d GIF: clean first frame, Remove before last frame
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=[] FLAGGED=false
```

## Live A6 probe (real proxy + pin, signed-in /decks, auth lost via a storage event; no Convex writes)

```
BEFORE  url=/decks report={"saved":"cyberpunk/dark/expressive","patched":true,"problems":[]} flagged=false
JWT keys in localStorage: 1
AFTER   url=/decks report={"saved":"cyberpunk/dark/expressive","patched":false,"problems":[]} flagged=false
ModifyQuerySet frames mentioning getSession or Remove after load:
  {"type":"ModifyQuerySet","baseVersion":5,"newVersion":6,"modifications":[{"type":"Add","queryId":6,"udfPath":"sessions:getSession","args":[{}]}]}
  {"type":"ModifyQuerySet","baseVersion":48,"newVersion":49,"modifications":[{"type":"Remove","queryId":6}]}
blocked writes: 5
```

## r3.ts

```ts
// Round-3 probes against the real pin.ts at 855b9fb. shotPin below copies the logic of capture.ts's shotPin (not exported; capture.ts runs main on import).
import { createSessionPin, pinFlagged, appearanceKey, type PinReport } from "../../scripts/pr-capture/pin.ts";

const PIN = { theme: "aurora", mode: "light", chrome: "calm" } as const;
const EQ = { theme: "cyberpunk", mode: "dark", chrome: "expressive" } as const;
const SAVED = { _id: "s1", userId: "u1", theme: "dark", chrome: "expressive", colorSource: { kind: "preset", preset: "cyberpunk" } };
const OTHER = { _id: "s9", userId: "u9", theme: "light", chrome: "calm", colorSource: { kind: "preset", preset: "noir" } };
const sub = (id = 3) => ({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: id, udfPath: "sessions:getSession" }] });
const rem = (id = 3) => ({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId: id }] });
const upd = (value: unknown, id = 3, type = "QueryUpdated") => JSON.stringify({ type: "Transition", modifications: [{ type, queryId: id, value }] });

function shotPin(snapshots: (PinReport | undefined)[], appearance: { theme: string; mode: "light" | "dark"; chrome: string }) {
  const taken = snapshots.filter((r): r is PinReport => r !== undefined);
  const problems = [...new Set(taken.flatMap((r) => r.problems))];
  if (!taken.length) problems.push("no pin snapshot was taken (no frame captured)");
  const saved = taken.findLast((r) => r.saved)?.saved ?? null;
  const patched = taken.length > 0 && taken.every((r) => r.patched);
  const pinned = appearanceKey(appearance);
  const report = { saved, patched, problems };
  return { ...report, pinned, overridden: patched && saved !== pinned, flagged: pinFlagged(report) };
}
const show = (name: string, s: ReturnType<typeof shotPin>, note = "") =>
  console.log(`${name}\n    patched=${s.patched} saved=${s.saved} overridden=${s.overridden} problems=${JSON.stringify(s.problems)} FLAGGED=${s.flagged}${note ? `  [${note}]` : ""}`);

type P = ReturnType<typeof createSessionPin>;
type C = { name: string; ap?: typeof PIN | typeof EQ; run: (p: P) => void };
const reg: C[] = [
  { name: "R1a subscribed, no result", run: (p) => p.socket().fromClient(sub()) },
  { name: "R1b QueryResult instead of QueryUpdated", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED, 3, "QueryResult")); } },
  { name: "R1c TransitionV2 frame", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] })); } },
  { name: "R1d modifications renamed", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "Transition", changes: [] })); } },
  { name: "R2-E1 pin==saved, no result", ap: EQ, run: (p) => p.socket().fromClient(sub()) },
  { name: "R2-E2 pin==saved, null", ap: EQ, run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(null)); } },
  { name: "R2-E3 pin==saved, never subscribed", ap: EQ, run: (p) => { p.socket(); } },
  { name: "R2-E4 pin==saved, QueryFailed", ap: EQ, run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryFailed", queryId: 3, errorMessage: "boom" }] })); } },
  { name: "R2-X2 reconnect, s2 result in TransitionV2", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 0, value: SAVED }] })); } },
  { name: "R2-X3 second sub, no result", run: (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 3)); } },
  { name: "R2-X4 second sub, QueryResult type", run: (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 3)); a.fromServer(upd(SAVED, 4, "QueryResult")); } },
  { name: "R2-X5 later update renamed type", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(upd(SAVED, 3, "QueryResult")); } },
  { name: "R2 binary frame after subscribe", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(Buffer.from("x")); } },
  { name: "R2 Transition without modifications", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(JSON.stringify({ type: "Transition" })); } },
  { name: "CTRL clean + Ping (must NOT flag)", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(JSON.stringify({ type: "Ping" })); } },
];
console.log("=== Regression (round 1 + round 2) ===");
for (const c of reg) { const ap = c.ap ?? PIN; const p = createSessionPin(ap); c.run(p); show(c.name, shotPin([p.report()], ap)); }

console.log("\n=== Adversarial (round 3) ===");
{
  const p = createSessionPin(PIN); const s = p.socket(); s.fromClient(sub());
  const at = p.report(); s.fromServer(upd(SAVED));
  show("A1a good result lands after snapshot, before png", shotPin([at], PIN), "conservative");
  const p2 = createSessionPin(PIN); const s2 = p2.socket(); s2.fromClient(sub()); s2.fromServer(upd(SAVED));
  const at2 = p2.report(); s2.fromServer(upd(null)); const after2 = p2.report();
  show("A1b null lands after snapshot, before png: that snapshot", shotPin([at2], PIN));
  show("A1b ... any later snapshot", shotPin([after2], PIN), "problem is sticky");
}
{
  const p = createSessionPin(PIN); const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED));
  const first = p.report(); s.fromServer(upd(null)); s.fromServer(upd(SAVED)); const last = p.report();
  show("A2a GIF: mid-GIF null then good", shotPin([first, last], PIN));
  const p3 = createSessionPin(PIN); const s3 = p3.socket(); s3.fromClient(sub()); s3.fromServer(upd(SAVED));
  const f3 = p3.report(); s3.fromServer(upd(SAVED, 3, "QueryResult")); s3.fromServer(upd(SAVED)); const l3 = p3.report();
  show("A2b GIF: mid-GIF unknown type then good", shotPin([f3, l3], PIN));
  const q = createSessionPin(PIN); const t = q.socket(); t.fromClient(sub(3)); t.fromServer(upd(SAVED, 3));
  const f1 = q.report(); t.fromClient(rem(3)); t.fromClient(sub(5)); const mid = q.report(); t.fromServer(upd(SAVED, 5)); const l1 = q.report();
  show("A2c GIF: mid-GIF Remove+Add, pending in middle, rewritten by last", shotPin([f1, l1], PIN), `middle report flagged=${pinFlagged(mid)}; middle frames not consulted`);
  const r = createSessionPin(PIN); const u = r.socket(); u.fromClient(sub(3)); u.fromServer(upd(SAVED, 3));
  const g1 = r.report(); u.fromClient(rem(3)); const gm = r.report(); u.fromClient(sub(6)); u.fromServer(upd(SAVED, 6)); const gl = r.report();
  show("A2d GIF: mid-GIF skip (Remove only), then re-Add+rewrite", shotPin([g1, gl], PIN), `middle report: patched=${gm.patched} problems=${JSON.stringify(gm.problems)} flagged=${pinFlagged(gm)}`);
}
{
  const ctxA = createSessionPin(PIN); const ctxB = createSessionPin(PIN);
  const a = ctxA.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED));
  const b = ctxB.socket(); b.fromClient(sub());
  show("A3 two contexts: ctx A clean", shotPin([ctxA.report()], PIN));
  show("A3 two contexts: ctx B no result", shotPin([ctxB.report()], PIN));
  const c = ctxA.socket(); c.fromClient(sub(0));
  show("A3b ctx A second page/socket pending", shotPin([ctxA.report()], PIN));
}
{
  const p = createSessionPin(PIN); const s = p.socket(); s.fromClient(sub()); const out = s.fromServer(upd(OTHER));
  const v = JSON.parse(out[0] as string).modifications[0].value;
  show("A4 valid shape, other user's prefs", shotPin([p.report()], PIN), `forwarded = ${v.colorSource.preset}/${v.theme}/${v.chrome}, userId=${v.userId}`);
}
{
  const p = createSessionPin(PIN); p.socket(); show("A5a provider never mounted (socket, no Add)", shotPin([p.report()], PIN));
  const q = createSessionPin(PIN); show("A5b no Convex socket at all", shotPin([q.report()], PIN));
}
{
  const p = createSessionPin(PIN); const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED)); s.fromClient(rem());
  show("A6a client Remove (useQuery -> 'skip'), no re-Add before shot", shotPin([p.report()], PIN));
  const q = createSessionPin(PIN); const t = q.socket(); t.fromClient(sub()); t.fromServer(upd(SAVED));
  t.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryRemoved", queryId: 3 }] }));
  show("A6b server QueryRemoved, no re-Add before shot", shotPin([q.report()], PIN));
  const r = createSessionPin(PIN); const u = r.socket(); u.fromClient(sub()); u.fromClient(rem());
  show("A6c Add then Remove before any result", shotPin([r.report()], PIN));
  const g = createSessionPin(PIN); const w = g.socket(); w.fromClient(sub()); w.fromServer(upd(SAVED));
  const gf = g.report(); w.fromClient(rem());
  show("A6d GIF: clean first frame, Remove before last frame", shotPin([gf, g.report()], PIN));
}
```

## live-a6.ts

```ts
// Live A6 probe: real proxy + real pin.ts. A signed-in /decks page loses auth (a sibling tab clears the
// Convex Auth JWT in localStorage -> storage event -> isAuthenticated=false -> getSession is "skip"ped).
// No Convex writes: Mutation/Action frames are dropped by the proxy, and nothing is sent to /api/auth.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { agentStorageState, newCaptureContext, settle, stableScreenshot } from "../../scripts/pr-capture/browser.ts";
import { pinFlagged } from "../../scripts/pr-capture/pin.ts";

process.loadEnvFile(".env.local");
const port = process.argv[2] ?? "8252";
const base = `http://localhost:${port}`;
const out = path.join(".pr-captures", "197", "verify4-a6-live");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const blocked: string[] = [];
const log: string[] = [];
const say = (s: string) => { console.log(s); log.push(s); };
try {
  const state = await agentStorageState(browser, base, blocked);
  const appearance = { theme: "aurora", mode: "light" as const, chrome: "expressive" };
  const { context, pin } = await newCaptureContext(browser, { viewport: "desktop", appearance, storageState: state, blocked, still: true });
  const frames: string[] = [];
  context.on("websocket" as never, () => {});
  const page = await context.newPage();
  page.on("websocket", (ws) => ws.on("framesent", (f) => { if (typeof f.payload === "string" && f.payload.includes("ModifyQuerySet")) frames.push(f.payload.slice(0, 300)); }));
  await page.goto(`${base}/decks`, { timeout: 180_000 });
  await settle(page);
  const before = await stableScreenshot(page, false, pin.report);
  fs.writeFileSync(path.join(out, "1-signed-in.png"), before.png);
  say(`BEFORE  url=${new URL(page.url()).pathname} report=${JSON.stringify(before.at)} flagged=${pinFlagged(before.at!)}`);

  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes("__convexAuthJWT")));
  say(`JWT keys in localStorage: ${keys.length}`);
  // Same thing a sibling tab clearing the token delivers: a `storage` event with newValue null.
  await page.evaluate((ks) => {
    for (const key of ks) {
      const oldValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      window.dispatchEvent(new StorageEvent("storage", { key, oldValue, newValue: null, storageArea: localStorage }));
    }
  }, keys);
  await page.waitForTimeout(4000);
  await settle(page);
  const after = await stableScreenshot(page, false, pin.report);
  fs.writeFileSync(path.join(out, "2-after-auth-lost.png"), after.png);
  say(`AFTER   url=${new URL(page.url()).pathname} report=${JSON.stringify(after.at)} flagged=${pinFlagged(after.at!)}`);
  say(`ModifyQuerySet frames mentioning getSession or Remove after load:`);
  for (const f of frames) if (/getSession|Remove/.test(f)) say(`  ${f.replace(/"(token|value)":"[^"]*"/g, '"$1":"<redacted>"')}`);
  say(`blocked writes: ${blocked.length}`);
  await context.close();
} finally {
  await browser.close();
  fs.writeFileSync(path.join(out, "probe-log.md"), "```\n" + log.join("\n") + "\n```\n");
}
```
