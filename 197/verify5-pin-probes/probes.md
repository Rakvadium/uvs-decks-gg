# Round-4 probes (PR #198 @ 419dfa0)

All probes import the PR's real `pin.ts` (`createSessionPin`, exported `shotPin`) and `browser.ts` (`newCaptureContext`, `stableScreenshot`) by absolute path. The harness lives outside the worktree.

## Unit probes (r4.ts)
```
=== Regression: rounds 1-3 (real shotPin) ===
ok   R1a subscribed, no result
      patched=false saved=null problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R1b QueryResult instead of QueryUpdated
      patched=false saved=null problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R1c TransitionV2 frame
      patched=false saved=null problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R1d modifications renamed
      patched=false saved=null problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-E1 pin==saved, no result
      patched=false saved=null problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-E2 pin==saved, null
      patched=false saved=null problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-E3 pin==saved, never subscribed
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   R2-E4 pin==saved, QueryFailed
      patched=false saved=null problems=["sessions:getSession failed: boom","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2 S1 partial shape (theme only)
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome/colorSource (shape changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2 array value
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2 renamed client ModifyQuerySet
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   R2 patched then null
      patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-X2 reconnect, s2 result in TransitionV2
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-X3 second sub, no result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-X4 second sub, QueryResult type
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-X5 later update renamed type
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2 binary frame after subscribe
      patched=true saved=cyberpunk/dark/expressive problems=["a binary sync frame was forwarded unpatched (protocol changed?)"] FLAGGED=true (expected true)
ok   R2 Transition without modifications
      patched=true saved=cyberpunk/dark/expressive problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)"] FLAGGED=true (expected true)
ok   R3-A5a provider never mounted (socket, no Add)
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   R3-A5b no Convex socket at all
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   R3-A6a client Remove, no re-Add
      patched=false saved=cyberpunk/dark/expressive problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true (expected true)
ok   R3-A6b server QueryRemoved, no re-Add
      patched=false saved=cyberpunk/dark/expressive problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true (expected true)
ok   R3-A6c Add then Remove before any result
      patched=false saved=null problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true (expected true)
ok   R3-A6d GIF: clean first frame, Remove before last
      patched=false saved=cyberpunk/dark/expressive problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true (expected true)
ok   R3-A2c GIF: Remove+Add pending in middle frame
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R3-A2d GIF: skip in middle, re-Add+rewrite by last
      patched=false saved=cyberpunk/dark/expressive problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true (expected true)
ok   R3-A1a good result after snapshot (that snapshot)
      patched=false saved=null problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)  [conservative]
ok   CTRL clean (must NOT flag)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   CTRL clean + Ping (must NOT flag)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   CTRL sessions.js:getSession (must NOT flag)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   CTRL Remove then re-Add rewritten (must NOT flag)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   CTRL reconnect, s2 rewritten (must NOT flag)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)

=== Round 4 adversarial ===
ok   B1a re-Added after removal, no result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1b re-Added after removal (same id), no result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1c re-Added after removal, result in QueryResult
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1d server QueryRemoved, then re-Add, null result
      patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
MISS B2 reconnect: old socket clean, new socket never re-subscribes (reload signed out / provider gone)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected true)  [old socket's entry still counts as live]
MISS B3 reconnect (AuthError restart): s2 re-Adds then Removes (token refresh failed -> skip)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected true)  [A6 again, after a reconnect]
MISS B3b reconnect: s2 re-Adds, server QueryRemoved on s2
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected true)
MISS B4 old socket pending at close, new socket rewritten (false-alarm check)
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected false)  [a correct page]
MISS B5 GIF: Remove+Add+rewrite all between two frame snapshots
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected true)  [snapshots identical: true; a frame between could show defaults]
MISS B6 GIF: Remove reaches Node after the last frame's snapshot (page already rendered skip)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected true)  [report after recording: flagged=true, not consulted]
ok   B7a shotPin([])
      patched=false saved=null problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7b shotPin([undefined])
      patched=false saved=null problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7c shotPin([clean, undefined])
      patched=false saved=cyberpunk/dark/expressive problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7d hand-built patched:false, problems:[]
      patched=false saved=x/dark/calm problems=["the session result was not rewritten when the image was taken"] FLAGGED=true (expected true)
ok   B8 chunked transition never completes
      patched=false saved=null problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B9 chunked transition, totalParts missing
      patched=false saved=null problems=["a chunked transition couldn't be reassembled and was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B10 same id twice in one Transition: null then valid
      patched=true saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite"] FLAGGED=true (expected true)

unexpected outcomes: 6
```

## Live probes (live.ts)
```
L1 BEFORE url=/decks sockets=2 patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false
L1 AFTER  url=/decks sockets=4 stable=true sign-in links=5 patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false
ModifyQuerySet frames (args/values redacted):
  socket2: {"type":"ModifyQuerySet","baseVersion":1,"newVersion":2,"modifications":[{"type":"Remove","queryId":1}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":4,"newVersion":5,"modifications":[{"type":"Add","queryId":5,"udfPath":"sessions:getSession","args":<redacted>}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":12,"newVersion":13,"modifications":[{"type":"Remove","queryId":11}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":13,"newVersion":14,"modifications":[{"type":"Remove","queryId":7}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":14,"newVersion":15,"modifications":[{"type":"Remove","queryId":8}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":15,"newVersion":16,"modifications":[{"type":"Remove","queryId":6}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":16,"newVersion":17,"modifications":[{"type":"Remove","queryId":9}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":17,"newVersion":18,"modifications":[{"type":"Remove","queryId":10}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":26,"newVersion":27,"modifications":[{"type":"Remove","queryId":20}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":28,"newVersion":29,"modifications":[{"type":"Remove","queryId":3}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":29,"newVersion":30,"modifications":[{"type":"Remove","queryId":4}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":30,"newVersion":31,"modifications":[{"type":"Remove","queryId":12}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":35,"newVersion":36,"modifications":[{"type":"Remove","queryId":19}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":37,"newVersion":38,"modifications":[{"type":"Remove","queryId":22}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":38,"newVersion":39,"modifications":[{"type":"Remove","queryId":23}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":41,"newVersion":42,"modifications":[{"type":"Remove","queryId":27}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":42,"newVersion":43,"modifications":[{"type":"Remove","queryId":28}]}
  socket4: {"type":"ModifyQuerySet","baseVersion":1,"newVersion":2,"modifications":[{"type":"Remove","queryId":1}]}
  socket4: {"type":"ModifyQuerySet","baseVersion":2,"newVersion":3,"modifications":[{"type":"Remove","queryId":13}]}
  socket4: {"type":"ModifyQuerySet","baseVersion":6,"newVersion":7,"modifications":[{"type":"Remove","queryId":14}]}
  socket4: {"type":"ModifyQuerySet","baseVersion":7,"newVersion":8,"modifications":[{"type":"Remove","queryId":15}]}
  socket4: {"type":"ModifyQuerySet","baseVersion":10,"newVersion":11,"modifications":[{"type":"Remove","queryId":17}]}
  socket4: {"type":"ModifyQuerySet","baseVersion":11,"newVersion":12,"modifications":[{"type":"Remove","queryId":18}]}
  socket4: {"type":"ModifyQuerySet","baseVersion":14,"newVersion":15,"modifications":[{"type":"Remove","queryId":19}]}
  socket4: {"type":"ModifyQuerySet","baseVersion":15,"newVersion":16,"modifications":[{"type":"Remove","queryId":20}]}
  getSession Add frames on socket2: 1
L2 CONTROL reload signed in: patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false
L3 never-settling pin: returned after 30.4s, snapshots=73, stable=false, patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true  (png saved; DOM now=PINNED)
blocked writes: 12 (Mutation:sessions:ensureAppearanceMigrated, Action:communityLive:refreshLiveStatus)
```

## Never-settling window (l3b.ts)
```
L3b lag=150ms: returned after 30.4s, snapshots=73, stable=false, returned snapshot patched=true problems=[] FLAGGED=false (png shows PINNED)
L3b lag=600ms: returned after 30.4s, snapshots=73, stable=false, returned snapshot patched=true problems=[] FLAGGED=false (png shows DEFAULTS)
```

## r4.ts
```ts
// Round-4 probes against the real pin.ts at 419dfa0 (createSessionPin + exported shotPin, imported by absolute path).
import { createSessionPin, pinFlagged, shotPin, type PinReport } from "file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a803a271b490d114c/scripts/pr-capture/pin.ts";

const PIN = { theme: "aurora", mode: "light", chrome: "calm" } as const;
const EQ = { theme: "cyberpunk", mode: "dark", chrome: "expressive" } as const;
const SAVED = { _id: "s1", userId: "u1", theme: "dark", chrome: "expressive", colorSource: { kind: "preset", preset: "cyberpunk" } };
const sub = (id = 3, udfPath = "sessions:getSession") => ({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: id, udfPath }] });
const rem = (id = 3) => ({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId: id }] });
const upd = (value: unknown, id = 3, type = "QueryUpdated") => JSON.stringify({ type: "Transition", modifications: [{ type, queryId: id, value }] });
const qrem = (id = 3) => JSON.stringify({ type: "Transition", modifications: [{ type: "QueryRemoved", queryId: id }] });
type Ap = typeof PIN | typeof EQ;
let bad = 0;
const show = (name: string, snaps: (PinReport | undefined)[], ap: Ap, expect: boolean, note = "") => {
  const s = shotPin(snaps, ap as never);
  const ok = s.flagged === expect;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${name}\n      patched=${s.patched} saved=${s.saved} problems=${JSON.stringify(s.problems)} FLAGGED=${s.flagged} (expected ${expect})${note ? `  [${note}]` : ""}`);
};
type P = ReturnType<typeof createSessionPin>;
const one = (name: string, run: (p: P) => void, expect = true, ap: Ap = PIN, note = "") => { const p = createSessionPin(ap as never); run(p); show(name, [p.report()], ap, expect, note); };

console.log("=== Regression: rounds 1-3 (real shotPin) ===");
one("R1a subscribed, no result", (p) => p.socket().fromClient(sub()));
one("R1b QueryResult instead of QueryUpdated", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED, 3, "QueryResult")); });
one("R1c TransitionV2 frame", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] })); });
one("R1d modifications renamed", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "Transition", changes: [] })); });
one("R2-E1 pin==saved, no result", (p) => p.socket().fromClient(sub()), true, EQ);
one("R2-E2 pin==saved, null", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(null)); }, true, EQ);
one("R2-E3 pin==saved, never subscribed", (p) => { p.socket(); }, true, EQ);
one("R2-E4 pin==saved, QueryFailed", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryFailed", queryId: 3, errorMessage: "boom" }] })); }, true, EQ);
one("R2 S1 partial shape (theme only)", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ theme: "dark" })); });
one("R2 array value", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd([1])); });
one("R2 renamed client ModifyQuerySet", (p) => { const s = p.socket(); s.fromClient({ ...sub(), type: "ModifyQuerySetV2" } as never); s.fromServer(upd(SAVED)); });
one("R2 patched then null", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED)); s.fromServer(upd(null)); });
one("R2-X2 reconnect, s2 result in TransitionV2", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 0, value: SAVED }] })); });
one("R2-X3 second sub, no result", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 3)); });
one("R2-X4 second sub, QueryResult type", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 3)); a.fromServer(upd(SAVED, 4, "QueryResult")); });
one("R2-X5 later update renamed type", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(upd(SAVED, 3, "QueryResult")); });
one("R2 binary frame after subscribe", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(Buffer.from("x")); });
one("R2 Transition without modifications", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(JSON.stringify({ type: "Transition" })); });
one("R3-A5a provider never mounted (socket, no Add)", (p) => { p.socket(); });
one("R3-A5b no Convex socket at all", () => {});
one("R3-A6a client Remove, no re-Add", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED)); s.fromClient(rem()); });
one("R3-A6b server QueryRemoved, no re-Add", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED)); s.fromServer(qrem()); });
one("R3-A6c Add then Remove before any result", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromClient(rem()); });
{
  const g = createSessionPin(PIN); const w = g.socket(); w.fromClient(sub()); w.fromServer(upd(SAVED));
  const gf = g.report(); w.fromClient(rem()); show("R3-A6d GIF: clean first frame, Remove before last", [gf, g.report()], PIN, true);
  const q = createSessionPin(PIN); const t = q.socket(); t.fromClient(sub(3)); t.fromServer(upd(SAVED, 3));
  const f1 = q.report(); t.fromClient(rem(3)); t.fromClient(sub(5)); const mid = q.report(); t.fromServer(upd(SAVED, 5));
  show("R3-A2c GIF: Remove+Add pending in middle frame", [f1, mid, q.report()], PIN, true);
  const r = createSessionPin(PIN); const u = r.socket(); u.fromClient(sub(3)); u.fromServer(upd(SAVED, 3));
  const g1 = r.report(); u.fromClient(rem(3)); const gm = r.report(); u.fromClient(sub(6)); u.fromServer(upd(SAVED, 6));
  show("R3-A2d GIF: skip in middle, re-Add+rewrite by last", [g1, gm, r.report()], PIN, true);
}
{
  const p = createSessionPin(PIN); const s = p.socket(); s.fromClient(sub()); const at = p.report(); s.fromServer(upd(SAVED));
  show("R3-A1a good result after snapshot (that snapshot)", [at], PIN, true, "conservative");
}
one("CTRL clean (must NOT flag)", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); }, false);
one("CTRL clean + Ping (must NOT flag)", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(JSON.stringify({ type: "Ping" })); }, false);
one("CTRL sessions.js:getSession (must NOT flag)", (p) => { const a = p.socket(); a.fromClient(sub(3, "sessions.js:getSession")); a.fromServer(upd(SAVED)); }, false);
one("CTRL Remove then re-Add rewritten (must NOT flag)", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromServer(upd(SAVED, 3)); a.fromClient(rem(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 4)); }, false);
one("CTRL reconnect, s2 rewritten (must NOT flag)", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(upd(SAVED, 0)); }, false);

console.log("\n=== Round 4 adversarial ===");
one("B1a re-Added after removal, no result", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromServer(upd(SAVED, 3)); a.fromClient(rem(3)); a.fromClient(sub(4)); });
one("B1b re-Added after removal (same id), no result", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromServer(upd(SAVED, 3)); a.fromClient(rem(3)); a.fromClient(sub(3)); });
one("B1c re-Added after removal, result in QueryResult", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromServer(upd(SAVED, 3)); a.fromClient(rem(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 4, "QueryResult")); });
one("B1d server QueryRemoved, then re-Add, null result", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromServer(upd(SAVED, 3)); a.fromServer(qrem(3)); a.fromClient(sub(4)); a.fromServer(upd(null, 4)); });
one("B2 reconnect: old socket clean, new socket never re-subscribes (reload signed out / provider gone)", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); const b = p.socket(); b.fromServer(JSON.stringify({ type: "Ping" })); }, true, PIN, "old socket's entry still counts as live");
one("B3 reconnect (AuthError restart): s2 re-Adds then Removes (token refresh failed -> skip)", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(JSON.stringify({ type: "AuthError", error: "expired" })); const b = p.socket(); b.fromClient(sub(0)); b.fromClient(rem(0)); }, true, PIN, "A6 again, after a reconnect");
one("B3b reconnect: s2 re-Adds, server QueryRemoved on s2", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(qrem(0)); });
one("B4 old socket pending at close, new socket rewritten (false-alarm check)", (p) => { const a = p.socket(); a.fromClient(sub()); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(upd(SAVED, 0)); }, false, PIN, "a correct page");
{
  const p = createSessionPin(PIN); const a = p.socket(); a.fromClient(sub(3)); a.fromServer(upd(SAVED, 3));
  const f1 = p.report(); a.fromClient(rem(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 4)); const f2 = p.report();
  show("B5 GIF: Remove+Add+rewrite all between two frame snapshots", [f1, f2], PIN, true, `snapshots identical: ${JSON.stringify(f1) === JSON.stringify(f2)}; a frame between could show defaults`);
}
{
  const p = createSessionPin(PIN); const a = p.socket(); a.fromClient(sub(3)); a.fromServer(upd(SAVED, 3));
  const last = p.report(); a.fromClient(rem(3));
  show("B6 GIF: Remove reaches Node after the last frame's snapshot (page already rendered skip)", [last], PIN, true, `report after recording: flagged=${pinFlagged(p.report())}, not consulted`);
}
show("B7a shotPin([])", [], PIN, true);
show("B7b shotPin([undefined])", [undefined], PIN, true);
show("B7c shotPin([clean, undefined])", [(() => { const p = createSessionPin(PIN); const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); return p.report(); })(), undefined], PIN, true);
show("B7d hand-built patched:false, problems:[]", [{ saved: "x/dark/calm", patched: false, problems: [] }], PIN, true);
one("B8 chunked transition never completes", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(JSON.stringify({ type: "TransitionChunk", partNumber: 0, totalParts: 2, chunk: upd(SAVED).slice(0, 20) })); });
one("B9 chunked transition, totalParts missing", (p) => { const a = p.socket(); a.fromClient(sub()); const t = upd(SAVED); a.fromServer(JSON.stringify({ type: "TransitionChunk", chunk: t.slice(0, 20) })); a.fromServer(JSON.stringify({ type: "TransitionChunk", chunk: t.slice(20) })); });
one("B10 same id twice in one Transition: null then valid", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryUpdated", queryId: 3, value: null }, { type: "QueryUpdated", queryId: 3, value: SAVED }] })); });
console.log(`\nunexpected outcomes: ${bad}`);
```

## live.ts
```ts
// Round-4 live probes: the PR's real newCaptureContext (proxy + pin), stableScreenshot and shotPin, by absolute path.
// No Convex writes: the proxy drops Mutation/Action frames. Signing out = clearing this context's cookies + localStorage.
import fs from "node:fs";
import path from "node:path";
const { chromium } = await import("file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a803a271b490d114c/node_modules/playwright/index.mjs");
const ROOT = "file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a803a271b490d114c/scripts/pr-capture/";
const { agentStorageState, newCaptureContext, settle, stableScreenshot } = await import(ROOT + "browser.ts");
const { createSessionPin, shotPin } = await import(ROOT + "pin.ts");

process.loadEnvFile("C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a803a271b490d114c/.env.local");
const base = `http://localhost:${process.argv[2] ?? "8261"}`;
const out = "C:/Users/xenos/AppData/Local/Temp/v4h/live-out";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const log: string[] = [];
const say = (s: string) => { console.log(s); log.push(s); };
const brief = (p: { patched: boolean; saved: string | null; problems: string[]; flagged: boolean }) =>
  `patched=${p.patched} saved=${p.saved} problems=${JSON.stringify(p.problems)} FLAGGED=${p.flagged}`;

const browser = await chromium.launch();
const blocked: string[] = [];
try {
  // ---- L1: a new socket that never re-subscribes (reload after sign-out). Old socket's entry stays "live".
  const state = await agentStorageState(browser, base, blocked);
  const appearance = { theme: "aurora", mode: "light" as const, chrome: "expressive" };
  const { context, pin } = await newCaptureContext(browser, { viewport: "desktop", appearance, storageState: state, blocked, still: true });
  const page = await context.newPage();
  let sockets = 0;
  const sent: string[] = [];
  page.on("websocket", (ws) => {
    const n = ++sockets;
    ws.on("framesent", (f) => { if (typeof f.payload === "string" && f.payload.includes("ModifyQuerySet")) sent.push(`socket${n}: ${f.payload.replace(/"(token|value|args)":("[^"]*"|\{[^}]*\}|\[[^\]]*\])/g, '"$1":<redacted>').slice(0, 220)}`); });
    ws.on("close", () => say(`  (browser socket ${n} closed)`));
  });
  await page.goto(`${base}/decks`, { timeout: 180_000 });
  await settle(page);
  const before = await stableScreenshot(page, false, pin.report);
  fs.writeFileSync(path.join(out, "L1-1-signed-in.png"), before.png);
  say(`L1 BEFORE url=${new URL(page.url()).pathname} sockets=${sockets} ${brief(shotPin([before.at], appearance))}`);

  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.reload({ timeout: 180_000 });
  await settle(page);
  const after = await stableScreenshot(page, false, pin.report);
  fs.writeFileSync(path.join(out, "L1-2-after-reload-signed-out.png"), after.png);
  const signedOut = await page.locator("text=/sign in/i").count();
  say(`L1 AFTER  url=${new URL(page.url()).pathname} sockets=${sockets} stable=${after.stable} sign-in links=${signedOut} ${brief(shotPin([after.at], appearance))}`);
  say("ModifyQuerySet frames (args/values redacted):");
  for (const f of sent) if (/getSession|Remove/.test(f)) say(`  ${f}`);
  say(`  getSession Add frames on socket2: ${sent.filter((f) => f.startsWith("socket2") && f.includes("getSession")).length}`);
  await context.close();

  // ---- L2 control: reload while still signed in -> new socket re-subscribes and is rewritten -> clean.
  const c2 = await newCaptureContext(browser, { viewport: "desktop", appearance, storageState: state, blocked, still: true });
  const p2 = await c2.context.newPage();
  await p2.goto(`${base}/decks`, { timeout: 180_000 });
  await settle(p2);
  await p2.reload({ timeout: 180_000 });
  await settle(p2);
  const ctl = await stableScreenshot(p2, false, c2.pin.report);
  say(`L2 CONTROL reload signed in: ${brief(shotPin([ctl.at], appearance))}`);
  await c2.context.close();

  // ---- L3: the pin snapshot never settles. Real stableScreenshot + real pin; the page shows the pin state
  // 150ms after each snapshot (the forward -> render lag), so each png shows the state of the previous snapshot.
  const ctx3 = await browser.newContext();
  const p3 = await ctx3.newPage();
  await p3.setContent(`<body style="margin:0"><div id=s style="font:48px sans-serif;padding:40px">DEFAULTS</div></body>`);
  const pin3 = createSessionPin(appearance);
  const sock = pin3.socket();
  const SAVED = { theme: "dark", chrome: "expressive", colorSource: { kind: "preset", preset: "cyberpunk" } };
  let id = 1;
  sock.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: id, udfPath: "sessions:getSession" }] });
  let calls = 0;
  const snapshot = () => {
    calls++;
    // Odd calls: provider remount (Remove+Add, pending). Even calls: rewritten result arrives.
    if (calls % 2) {
      sock.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId: id }, { type: "Add", queryId: ++id, udfPath: "sessions:getSession" }] });
    } else {
      sock.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryUpdated", queryId: id, value: SAVED }] }));
    }
    const r = pin3.report();
    const text = r.patched ? "PINNED" : "DEFAULTS";
    setTimeout(() => { void p3.evaluate((t) => { document.getElementById("s")!.textContent = t; }, text).catch(() => {}); }, 150);
    return r;
  };
  const t0 = Date.now();
  const res = await stableScreenshot(p3, false, snapshot);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  fs.writeFileSync(path.join(out, "L3-never-settles.png"), res.png);
  const shown = await p3.evaluate(() => document.getElementById("s")!.textContent);
  say(`L3 never-settling pin: returned after ${secs}s, snapshots=${calls}, stable=${res.stable}, ${brief(shotPin([res.at], appearance))}  (png saved; DOM now=${shown})`);
  await ctx3.close();
} finally {
  await browser.close();
  say(`blocked writes: ${blocked.length} (${[...new Set(blocked)].join(", ")})`);
  fs.writeFileSync(path.join(out, "probe-log.md"), "```\n" + log.join("\n") + "\n```\n");
}
```

## l3b.ts
```ts
// L3b: the pin keeps changing (provider remount loop) until just before stableScreenshot's 30s deadline, then the
// first rewritten result lands on the last iteration. Real stableScreenshot + real createSessionPin + real shotPin.
// The page renders the pin state 150ms after each snapshot (forward -> WS -> React render lag).
import fs from "node:fs";
const ROOT = "file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a803a271b490d114c/";
const { chromium } = await import(ROOT + "node_modules/playwright/index.mjs");
const { stableScreenshot } = await import(ROOT + "scripts/pr-capture/browser.ts");
const { createSessionPin, shotPin } = await import(ROOT + "scripts/pr-capture/pin.ts");

const appearance = { theme: "aurora", mode: "light" as const, chrome: "expressive" };
const SAVED = { theme: "dark", chrome: "expressive", colorSource: { kind: "preset", preset: "cyberpunk" } };
const browser = await chromium.launch();
try {
  for (const lagMs of [150, 600]) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.setContent(`<body style="margin:0"><div id=s style="font:48px sans-serif;padding:40px">DEFAULTS</div></body>`);
    const pin = createSessionPin(appearance);
    const sock = pin.socket();
    let id = 1;
    sock.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: id, udfPath: "sessions:getSession" }] });
    const t0 = Date.now();
    const settleAt = t0 + 29_750;
    let calls = 0;
    let lastClean = false;
    const snapshot = () => {
      calls++;
      const now = Date.now();
      const remount = () => sock.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId: id }, { type: "Add", queryId: ++id, udfPath: "sessions:getSession" }] });
      const result = () => sock.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryUpdated", queryId: id, value: SAVED }] }));
      // Provider remount loop: alternately pending (Remove+Add) and rewritten, so the snapshot keeps changing.
      if (now < settleAt - 450) { if (calls % 2) remount(); else result(); lastClean = !(calls % 2); }
      else if (now < settleAt) { if (lastClean) { remount(); lastClean = false; } }
      else if (!lastClean) { result(); lastClean = true; }
      const r = pin.report();
      const text = r.patched ? "PINNED" : "DEFAULTS";
      setTimeout(() => { void page.evaluate((t: string) => { document.getElementById("s")!.textContent = t; }, text).catch(() => {}); }, lagMs);
      return r;
    };
    const res = await stableScreenshot(page, false, snapshot);
    const file = `C:/Users/xenos/AppData/Local/Temp/v4h/live-out/L3b-lag${lagMs}.png`;
    fs.writeFileSync(file, res.png);
    const s = shotPin([res.at], appearance);
    console.log(`L3b lag=${lagMs}ms: returned after ${((Date.now() - t0) / 1000).toFixed(1)}s, snapshots=${calls}, stable=${res.stable}, ` +
      `returned snapshot patched=${s.patched} problems=${JSON.stringify(s.problems)} FLAGGED=${s.flagged}; png -> ${file}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
```
