# Round-5 verifier probes (PR #198 @ 45b96f4)

Every probe uses the real `pin.ts` (`createSessionPin`, `shotPin`, `stillPin`). The live probes also use the real `newCaptureContext`, `settle`, `stableScreenshot` and `recordFrames`. All are imported by absolute path, and the scripts were kept outside the worktree.

## Unit probes (r5.ts): rounds 2-4 regression + round-5 shapes

```
=== Round 2 (m1.ts) ===
ok   M1a no result
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   M1b QueryResult type
      patched=false saved=null problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   M1c TransitionV2 frame
      patched=false saved=null problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   M1d modifications renamed
      patched=false saved=null problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   S1 partial (only theme)
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome/colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   S1 partial (theme+chrome)
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   S1 custom colorSource (valid)
      patched=true saved=custom/dark/expressive problems=[] FLAGGED=false (expected false)
ok   S1 empty chrome
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   S1 empty preset
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X1 reconnect (old closed), s2 re-Adds, no result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X2 reconnect (old closed), s2 result TransitionV2
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X2b reconnect (old closed), s2 rewritten
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   X3 two subs, one without result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X4 two subs, other QueryResult
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X5 later update renamed type
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X6 patched then null
      patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X7 sessions.js:getSession
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   X8 batched Add + chunk with Ping between
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   X9 array value
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X10 string value
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   X11 renamed client frame
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   E1 pin==saved no result
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   E2 pin==saved null
      patched=false saved=null problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   E3 pin==saved never subscribed
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   E4 pin==saved QueryFailed
      patched=false saved=null problems=["sessions:getSession failed: boom","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   binary frame after subscribe
      patched=true saved=cyberpunk/dark/expressive problems=["a binary sync frame was forwarded unpatched (protocol changed?)"] FLAGGED=true (expected true)
ok   Transition without modifications
      patched=true saved=cyberpunk/dark/expressive problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)"] FLAGGED=true (expected true)
ok   CTRL clean
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   CTRL clean + Ping
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)

=== Round 3 (r3.ts) ===
ok   A1a good result after snapshot (that snapshot)
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)  [conservative]
ok   A1b pre-null snapshot (valid at that moment)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   A1b later snapshot
      patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)  [sticky]
ok   A2a GIF mid null then good
      patched=true saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   A2b GIF mid unknown type then good
      patched=true saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   A2c GIF Remove+Add pending mid (middle frame snapshot)
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   A2c' GIF Remove+Add, middle not snapshotted (unpinned counter)
      patched=true saved=cyberpunk/dark/expressive problems=["the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   A2d GIF skip mid, re-Add by last
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   A3 ctx A clean
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   A3 ctx B no result
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   A3b ctx A second socket pending
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   A4 valid shape, other user's prefs
      patched=true saved=noir/light/calm problems=[] FLAGGED=false (expected false)  [identity out of scope]
ok   A5a socket, no Add
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   A5b no socket
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   A6a client Remove
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   A6b server QueryRemoved
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   A6c Add then Remove before result
      patched=false saved=null problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   A6d GIF Remove before last
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)

=== Round 4 (r4.ts), with close() ===
ok   B1a re-Add new id, no result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1b re-Add same id, no result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1c re-Add, QueryResult
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1d QueryRemoved, re-Add, null
      patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B2 reconnect, new socket never re-subscribes
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   B2' old close arrives after new socket opened (no re-subscribe)
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   B3 AuthError restart: s2 re-Add then Remove
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   B3b s2 QueryRemoved
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   B4 old pending at close, new rewritten (correct page)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   B4' old pending, close arrives after new rewritten (correct page)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   B5 GIF Remove+Add+rewrite between frames
      patched=true saved=cyberpunk/dark/expressive problems=["the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   B6 GIF Remove after last frame (with after-recording snapshot)
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   B7a shotPin([])
      patched=false saved=null problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7b shotPin([undefined])
      patched=false saved=null problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7c stillPin(undefined)
      patched=false saved=null problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7d hand-built patched:false
      patched=false saved=x problems=["the session result was not rewritten when the image was taken"] FLAGGED=true (expected true)
ok   B8 chunk never completes
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B9 chunks, totalParts missing
      patched=false saved=null problems=["a chunked transition couldn't be reassembled and was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B10 same id twice: null then valid
      patched=true saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite"] FLAGGED=true (expected true)
ok   L3 unsettled still with clean snapshot
      patched=true saved=cyberpunk/dark/expressive problems=["the image and pin state never stayed unchanged for the full stability window (30s ran out)"] FLAGGED=true (expected true)

=== Round 5 adversarial (reachable shapes) ===
ok   C1 still after blip + reconnect, rewritten
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)  [correct page]
ok   C1 GIF spanning blip (page kept cached pinned state)
      patched=true saved=cyberpunk/dark/expressive problems=["the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)  [conservative, agreed rule]
ok   C2 token refresh: Authenticate frame, QueryUpdated rewritten again
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   C3 AuthError, close, reconnect signed out (no Add)
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   C4 frames after close are ignored (late null on closed socket, new socket clean)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   C5 half chunk at close, new socket clean
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)
ok   C6 two pages in a context: page A socket closed, popup B clean
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)  [context-wide; page A is no longer an app page]
ok   C7 two pages: page A Remove (skip), popup B clean
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)  [context-wide: hides A's skip if B stays rewritten]

cases: 75, unexpected outcomes: 0
```

## Live probes (live5.ts), one block per invocation, each with a fresh agent login

```
BLIP 3000ms: before patched=true problems=[] FLAGGED=false | during offline report patched=true problems=[] | after: sockets=2 closes=0 frames=[] stable=true jsClass=light-class patched=true problems=[] FLAGGED=false
NAV soft (link click, found=1): url=/gallery sockets=2 closes=0 patched=true problems=[] FLAGGED=false
NAV hard (location.assign): url=/decks sockets=4 closes=0 jsClass=light-class patched=true problems=[] FLAGGED=false
NAV away to about:blank: closes=0 report={"saved":"cyberpunk/dark/expressive","patched":false,"problems":["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"],"events":6,"unpinned":4}
blocked writes: 11 (Action:communityLive:refreshLiveStatus, Mutation:sessions:ensureAppearanceMigrated)
BLIP 12000ms: before patched=true problems=[] FLAGGED=false | during offline report patched=true problems=[] | after: sockets=2 closes=0 frames=["MQS ","MQS  Remove"] stable=true jsClass=light-class patched=true problems=[] FLAGGED=false
GIFBLIP (offline 1.5s mid-GIF): pre-GIF frames clean=true; sockets=2 closes=0 frames=133 patched=true problems=[] FLAGGED=false
GIFNAV hard nav mid-GIF: frames=60 patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true
blocked writes: 14 (Action:communityLive:refreshLiveStatus, Mutation:sessions:ensureAppearanceMigrated)
DROP still: before patched=true problems=[] FLAGGED=false | dropped=1 mid patched=false | after reconnect: syncSockets=2 stable=true jsClass=light-class patched=true problems=[] FLAGGED=false
GIFDROP server drop mid-GIF: dropped=1 syncSockets=2 frames=132 unpinned values=[1,2,3] patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true
blocked writes: 10 (Action:communityLive:refreshLiveStatus, Mutation:sessions:ensureAppearanceMigrated)
TABS popup open: sockets=4 patched=true problems=[] FLAGGED=false
TABS popup closed: closes=0 patched=true problems=[] FLAGGED=false
TABS original page left the app, popup2 still on /decks: report={"saved":"cyberpunk/dark/expressive","patched":true,"problems":[],"events":8,"unpinned":3}
REAUTH same-token storage event: before patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true | frames after=[] sockets=2 | after stable=true jsClass=light-class patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
blocked writes: 14 (Action:communityLive:refreshLiveStatus, Mutation:sessions:ensureAppearanceMigrated)
REAUTH same-token storage event: before patched=true problems=[] FLAGGED=false | frames after=[] sockets=2 | after stable=true jsClass=light-class patched=true problems=[] FLAGGED=false
blocked writes: 5 (Action:communityLive:refreshLiveStatus, Mutation:sessions:ensureAppearanceMigrated)
L1 before: stable=true patched=true problems=[] FLAGGED=false
L1 after sign-out + reload: sockets=4 stable=true signIn=5 patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
A6 auth lost via storage event (keys=1): stable=true patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
DROPOUT drop after clearing auth storage: syncSockets=2 signIn=0 patched=true problems=[] FLAGGED=false
NAVOUT hard nav after sign-out: url=/gallery patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
blocked writes: 19 (Action:communityLive:refreshLiveStatus, Mutation:sessions:ensureAppearanceMigrated)
```

The first REAUTH line (after TABS) started signed out: that context reused a storage state whose auth session an earlier context had invalidated. The shot was flagged. REAUTH was then re-run alone (the next line).

## r5.ts

```ts
// Round-5 probes against the real pin.ts at 45b96f4 (createSessionPin, shotPin, stillPin), by absolute path.
// Reconnect cases call close() on the old socket, as proxyConvexSocket now does from ws/server onClose.
import { createSessionPin, shotPin, stillPin, type PinReport } from "file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a5fb8de1fac79aa91/scripts/pr-capture/pin.ts";

const PIN = { theme: "aurora", mode: "light", chrome: "calm" } as const;
const EQ = { theme: "cyberpunk", mode: "dark", chrome: "expressive" } as const;
const SAVED = { _id: "s1", userId: "u1", theme: "dark", chrome: "expressive", colorSource: { kind: "preset", preset: "cyberpunk" } };
const OTHER = { _id: "s9", userId: "u9", theme: "light", chrome: "calm", colorSource: { kind: "preset", preset: "noir" } };
const sub = (id = 3, udfPath = "sessions:getSession") => ({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: id, udfPath }] });
const rem = (id = 3) => ({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId: id }] });
const upd = (value: unknown, id = 3, type = "QueryUpdated") => JSON.stringify({ type: "Transition", modifications: [{ type, queryId: id, value }] });
const qrem = (id = 3) => JSON.stringify({ type: "Transition", modifications: [{ type: "QueryRemoved", queryId: id }] });
const failed = (id = 3) => JSON.stringify({ type: "Transition", modifications: [{ type: "QueryFailed", queryId: id, errorMessage: "boom" }] });
type Ap = typeof PIN | typeof EQ;
type P = ReturnType<typeof createSessionPin>;
let bad = 0;
let total = 0;
const show = (name: string, s: ReturnType<typeof shotPin>, expect: boolean, note = "") => {
  total++;
  const ok = s.flagged === expect;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${name}\n      patched=${s.patched} saved=${s.saved} problems=${JSON.stringify(s.problems)} FLAGGED=${s.flagged} (expected ${expect})${note ? `  [${note}]` : ""}`);
};
/** A still: one snapshot, stable. */
const one = (name: string, run: (p: P) => void, expect = true, ap: Ap = PIN, note = "") => {
  const p = createSessionPin(ap as never);
  run(p);
  show(name, stillPin(p.report(), true, ap as never), expect, note);
};
const clean = (p: P, id = 3) => { const s = p.socket(); s.fromClient(sub(id)); s.fromServer(upd(SAVED, id)); return s; };

console.log("=== Round 2 (m1.ts) ===");
one("M1a no result", (p) => p.socket().fromClient(sub()));
one("M1b QueryResult type", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED, 3, "QueryResult")); });
one("M1c TransitionV2 frame", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] })); });
one("M1d modifications renamed", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "Transition", changes: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] })); });
one("S1 partial (only theme)", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ _id: "s1", theme: "dark", prefs: {} })); });
one("S1 partial (theme+chrome)", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ _id: "s1", theme: "dark", chrome: "expressive" })); });
one("S1 custom colorSource (valid)", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ ...SAVED, colorSource: { kind: "custom", custom: {} } })); }, false);
one("S1 empty chrome", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ ...SAVED, chrome: "" })); });
one("S1 empty preset", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ ...SAVED, colorSource: { kind: "preset", preset: "" } })); });
one("X1 reconnect (old closed), s2 re-Adds, no result", (p) => { const a = clean(p); a.close(); p.socket().fromClient(sub(0)); });
one("X2 reconnect (old closed), s2 result TransitionV2", (p) => { const a = clean(p); a.close(); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 0, value: SAVED }] })); });
one("X2b reconnect (old closed), s2 rewritten", (p) => { const a = clean(p); a.close(); clean(p, 0); }, false);
one("X3 two subs, one without result", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 3)); });
one("X4 two subs, other QueryResult", (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 3)); a.fromServer(upd(SAVED, 4, "QueryResult")); });
one("X5 later update renamed type", (p) => { const a = clean(p); a.fromServer(upd(SAVED, 3, "QueryResult")); });
one("X6 patched then null", (p) => { const a = clean(p); a.fromServer(upd(null)); });
one("X7 sessions.js:getSession", (p) => { const a = p.socket(); a.fromClient(sub(3, "sessions.js:getSession")); a.fromServer(upd(SAVED)); }, false);
one("X8 batched Add + chunk with Ping between", (p) => { const a = p.socket(); a.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: 1, udfPath: "decks:list" }, { type: "Add", queryId: 3, udfPath: "sessions:getSession" }] }); const w = upd(SAVED); const h = w.length >> 1; a.fromServer(JSON.stringify({ type: "TransitionChunk", chunk: w.slice(0, h), partNumber: 0, totalParts: 2 })); a.fromServer(JSON.stringify({ type: "Ping" })); a.fromServer(JSON.stringify({ type: "TransitionChunk", chunk: w.slice(h), partNumber: 1, totalParts: 2 })); }, false);
one("X9 array value", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd([1, 2])); });
one("X10 string value", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd("x")); });
one("X11 renamed client frame", (p) => { const a = p.socket(); a.fromClient({ ...sub(), type: "ModifyQuerySetV2" } as never); a.fromServer(upd(SAVED)); });
one("E1 pin==saved no result", (p) => p.socket().fromClient(sub()), true, EQ);
one("E2 pin==saved null", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(null)); }, true, EQ);
one("E3 pin==saved never subscribed", (p) => { p.socket(); }, true, EQ);
one("E4 pin==saved QueryFailed", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(failed()); }, true, EQ);
one("binary frame after subscribe", (p) => { const a = clean(p); a.fromServer(Buffer.from("x")); });
one("Transition without modifications", (p) => { const a = clean(p); a.fromServer(JSON.stringify({ type: "Transition" })); });
one("CTRL clean", (p) => { clean(p); }, false);
one("CTRL clean + Ping", (p) => { const a = clean(p); a.fromServer(JSON.stringify({ type: "Ping" })); }, false);

console.log("\n=== Round 3 (r3.ts) ===");
{
  const p = createSessionPin(PIN); const s = p.socket(); s.fromClient(sub()); const at = p.report(); s.fromServer(upd(SAVED));
  show("A1a good result after snapshot (that snapshot)", stillPin(at, true, PIN), true, "conservative");
  const q = createSessionPin(PIN); const t = clean(q); const pre = q.report(); t.fromServer(upd(null));
  show("A1b pre-null snapshot (valid at that moment)", stillPin(pre, true, PIN), false);
  show("A1b later snapshot", stillPin(q.report(), true, PIN), true, "sticky");
}
{
  const gif = (name: string, f: (p: P, s: ReturnType<P["socket"]>, frames: PinReport[]) => void) => {
    const p = createSessionPin(PIN); const s = clean(p); const frames = [p.report()]; f(p, s, frames); frames.push(p.report());
    show(name, shotPin(frames, PIN), true);
  };
  gif("A2a GIF mid null then good", (_, s) => { s.fromServer(upd(null)); s.fromServer(upd(SAVED)); });
  gif("A2b GIF mid unknown type then good", (_, s) => { s.fromServer(upd(SAVED, 3, "QueryResult")); s.fromServer(upd(SAVED)); });
  gif("A2c GIF Remove+Add pending mid (middle frame snapshot)", (p, s, fr) => { s.fromClient(rem(3)); s.fromClient(sub(5)); fr.push(p.report()); s.fromServer(upd(SAVED, 5)); });
  gif("A2c' GIF Remove+Add, middle not snapshotted (unpinned counter)", (_, s) => { s.fromClient(rem(3)); s.fromClient(sub(5)); s.fromServer(upd(SAVED, 5)); });
  gif("A2d GIF skip mid, re-Add by last", (p, s, fr) => { s.fromClient(rem(3)); fr.push(p.report()); s.fromClient(sub(6)); s.fromServer(upd(SAVED, 6)); });
}
{
  const A = createSessionPin(PIN); const B = createSessionPin(PIN); clean(A); B.socket().fromClient(sub());
  show("A3 ctx A clean", stillPin(A.report(), true, PIN), false);
  show("A3 ctx B no result", stillPin(B.report(), true, PIN), true);
  A.socket().fromClient(sub(0)); show("A3b ctx A second socket pending", stillPin(A.report(), true, PIN), true);
}
one("A4 valid shape, other user's prefs", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(OTHER)); }, false, PIN, "identity out of scope");
one("A5a socket, no Add", (p) => { p.socket(); });
one("A5b no socket", () => {});
one("A6a client Remove", (p) => { clean(p).fromClient(rem()); });
one("A6b server QueryRemoved", (p) => { clean(p).fromServer(qrem()); });
one("A6c Add then Remove before result", (p) => { const s = p.socket(); s.fromClient(sub()); s.fromClient(rem()); });
{ const p = createSessionPin(PIN); const s = clean(p); const f = p.report(); s.fromClient(rem()); show("A6d GIF Remove before last", shotPin([f, p.report()], PIN), true); }

console.log("\n=== Round 4 (r4.ts), with close() ===");
one("B1a re-Add new id, no result", (p) => { const a = clean(p); a.fromClient(rem(3)); a.fromClient(sub(4)); });
one("B1b re-Add same id, no result", (p) => { const a = clean(p); a.fromClient(rem(3)); a.fromClient(sub(3)); });
one("B1c re-Add, QueryResult", (p) => { const a = clean(p); a.fromClient(rem(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 4, "QueryResult")); });
one("B1d QueryRemoved, re-Add, null", (p) => { const a = clean(p); a.fromServer(qrem(3)); a.fromClient(sub(4)); a.fromServer(upd(null, 4)); });
one("B2 reconnect, new socket never re-subscribes", (p) => { const a = clean(p); a.close(); p.socket().fromServer(JSON.stringify({ type: "Ping" })); });
one("B2' old close arrives after new socket opened (no re-subscribe)", (p) => { const a = clean(p); const b = p.socket(); b.fromServer(JSON.stringify({ type: "Ping" })); a.close(); });
one("B3 AuthError restart: s2 re-Add then Remove", (p) => { const a = clean(p); a.fromServer(JSON.stringify({ type: "AuthError", error: "expired" })); a.close(); const b = p.socket(); b.fromClient(sub(0)); b.fromClient(rem(0)); });
one("B3b s2 QueryRemoved", (p) => { const a = clean(p); a.close(); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(qrem(0)); });
one("B4 old pending at close, new rewritten (correct page)", (p) => { const a = p.socket(); a.fromClient(sub()); a.close(); clean(p, 0); }, false);
one("B4' old pending, close arrives after new rewritten (correct page)", (p) => { const a = p.socket(); a.fromClient(sub()); clean(p, 0); a.close(); }, false);
{ const p = createSessionPin(PIN); const a = clean(p); const f1 = p.report(); a.fromClient(rem(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 4)); show("B5 GIF Remove+Add+rewrite between frames", shotPin([f1, p.report()], PIN), true); }
{ const p = createSessionPin(PIN); const a = clean(p); const last = p.report(); a.fromClient(rem(3)); show("B6 GIF Remove after last frame (with after-recording snapshot)", shotPin([last, p.report()], PIN), true); }
show("B7a shotPin([])", shotPin([], PIN), true);
show("B7b shotPin([undefined])", shotPin([undefined], PIN), true);
show("B7c stillPin(undefined)", stillPin(undefined, true, PIN), true);
show("B7d hand-built patched:false", shotPin([{ saved: "x", patched: false, problems: [] }], PIN), true);
one("B8 chunk never completes", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(JSON.stringify({ type: "TransitionChunk", partNumber: 0, totalParts: 2, chunk: upd(SAVED).slice(0, 20) })); });
one("B9 chunks, totalParts missing", (p) => { const a = p.socket(); a.fromClient(sub()); const t = upd(SAVED); a.fromServer(JSON.stringify({ type: "TransitionChunk", chunk: t.slice(0, 20) })); a.fromServer(JSON.stringify({ type: "TransitionChunk", chunk: t.slice(20) })); });
one("B10 same id twice: null then valid", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryUpdated", queryId: 3, value: null }, { type: "QueryUpdated", queryId: 3, value: SAVED }] })); });
{ const p = createSessionPin(PIN); clean(p); show("L3 unsettled still with clean snapshot", stillPin(p.report(), false, PIN), true); }

console.log("\n=== Round 5 adversarial (reachable shapes) ===");
// Network blip / server restart: server closes, client reconnects and re-subscribes.
{
  const p = createSessionPin(PIN); const a = clean(p); const f1 = p.report(); a.close(); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(upd(SAVED, 0));
  show("C1 still after blip + reconnect, rewritten", stillPin(p.report(), true, PIN), false, "correct page");
  show("C1 GIF spanning blip (page kept cached pinned state)", shotPin([f1, p.report()], PIN), true, "conservative, agreed rule");
}
// Token refresh on the same socket: client Authenticate, server re-sends the session (rewritten).
one("C2 token refresh: Authenticate frame, QueryUpdated rewritten again", (p) => { const a = clean(p); a.fromClient({ type: "Authenticate", tokenType: "User", value: "x", baseVersion: 1 } as never); a.fromServer(upd(SAVED)); }, false);
// Token refresh failure: AuthError then server closes; reconnect without auth => provider skips (no Add).
one("C3 AuthError, close, reconnect signed out (no Add)", (p) => { const a = clean(p); a.fromServer(JSON.stringify({ type: "AuthError", error: "x", baseVersion: 1 })); a.close(); p.socket(); });
// Close on server side and late frames after close are ignored.
one("C4 frames after close are ignored (late null on closed socket, new socket clean)", (p) => { const a = clean(p); a.close(); clean(p, 0); a.fromServer(upd(null)); a.fromClient(sub(9)); }, false);
// Chunk half-received when socket closes, new socket clean.
one("C5 half chunk at close, new socket clean", (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(JSON.stringify({ type: "TransitionChunk", partNumber: 0, totalParts: 2, chunk: "{" })); a.close(); clean(p, 0); }, false);
// Multi-tab: popup in the same context subscribes; original page's socket closed (navigated away) -> context still "clean".
one("C6 two pages in a context: page A socket closed, popup B clean", (p) => { const a = clean(p); clean(p, 0); a.close(); }, false, PIN, "context-wide; page A is no longer an app page");
// Multi-tab: page A Remove (skip) while popup B still subscribed+rewritten.
one("C7 two pages: page A Remove (skip), popup B clean", (p) => { const a = clean(p); clean(p, 0); a.fromClient(rem(3)); }, false, PIN, "context-wide: hides A's skip if B stays rewritten");

console.log(`\ncases: ${total}, unexpected outcomes: ${bad}`);
```

## live5.ts

```ts
// Round-5 live probes: the PR's real newCaptureContext (proxy + pin), settle, stableScreenshot, recordFrames,
// stillPin and shotPin, imported by absolute path from the verify worktree. No Convex writes: the proxy drops
// Mutation/Action frames. "Signing out" only clears this browser context's cookies/localStorage.
import fs from "node:fs";
import path from "node:path";
const WT = "file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a5fb8de1fac79aa91/";
const { chromium } = await import(WT + "node_modules/playwright/index.mjs");
const { agentStorageState, newCaptureContext, settle, stableScreenshot, runSteps } = await import(WT + "scripts/pr-capture/browser.ts");
const { recordFrames } = await import(WT + "scripts/pr-capture/gif.ts");
const { shotPin, stillPin } = await import(WT + "scripts/pr-capture/pin.ts");

process.loadEnvFile("C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a5fb8de1fac79aa91/.env.local");
const base = `http://localhost:${process.argv[2] ?? "8271"}`;
const only = process.argv[3]?.split(",");
const out = "C:/Users/xenos/AppData/Local/Temp/v5h/live-out";
fs.mkdirSync(out, { recursive: true });
const log: string[] = [];
const say = (s: string) => { console.log(s); log.push(s); };
const brief = (p: { patched: boolean; saved: string | null; problems: string[]; flagged: boolean }) =>
  `patched=${p.patched} problems=${JSON.stringify(p.problems)} FLAGGED=${p.flagged}`;
const appearance = { theme: "aurora", mode: "light" as const, chrome: "expressive" };

const browser = await chromium.launch();
const blocked: string[] = [];
const state = await agentStorageState(browser, base, blocked);

async function withCtx(name: string, fn: (ctx: { context: any; pin: any; page: any; sockets: () => number; closes: () => number; sent: string[] }) => Promise<void>) {
  if (only && !only.includes(name)) return;
  const { context, pin } = await newCaptureContext(browser, { viewport: "desktop", appearance, storageState: state, blocked, still: true });
  let sockets = 0;
  let closes = 0;
  const sent: string[] = [];
  context.on("page", (pg: any) =>
    pg.on("websocket", (ws: any) => {
      sockets++;
      ws.on("framesent", (f: any) => {
        if (typeof f.payload !== "string") return;
        const t = /"type":"(\w+)"/.exec(f.payload)?.[1];
        if (t === "ModifyQuerySet") sent.push(`MQS ${/getSession/.test(f.payload) ? "+getSession" : ""}${/"Remove"/.test(f.payload) ? " Remove" : ""}`);
        else if (t === "Authenticate" || t === "Connect") sent.push(t);
      });
      ws.on("close", () => closes++);
    }),
  );
  const page = await context.newPage();
  try {
    await fn({ context, pin, page, sockets: () => sockets, closes: () => closes, sent });
  } catch (e) {
    say(`${name}: ERROR ${e instanceof Error ? e.message.split("\n")[0] : e}`);
  } finally {
    await context.close();
  }
}
async function still(page: any, pin: any, file: string) {
  await settle(page);
  const r = await stableScreenshot(page, false, pin.report);
  fs.writeFileSync(path.join(out, file), r.png);
  return { ...r, sp: stillPin(r.at, r.stable, appearance) };
}
const jsMode = (page: any) => page.evaluate(() => document.documentElement.className.includes("dark") ? "dark-class" : "light-class");

try {
  await withCtx("L1", async ({ context, pin, page, sockets }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    const a = await still(page, pin, "L1-1.png");
    say(`L1 before: stable=${a.stable} ${brief(a.sp)}`);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.reload({ timeout: 180_000 });
    const b = await still(page, pin, "L1-2.png");
    say(`L1 after sign-out + reload: sockets=${sockets()} stable=${b.stable} signIn=${await page.locator("text=/sign in/i").count()} ${brief(b.sp)}`);
  });
  await withCtx("L2", async ({ pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    await page.reload({ timeout: 180_000 });
    const b = await still(page, pin, "L2.png");
    say(`L2 control reload signed in: stable=${b.stable} ${brief(b.sp)}`);
  });
  await withCtx("A6", async ({ pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes("__convexAuthJWT")));
    await page.evaluate((ks: string[]) => {
      for (const key of ks) {
        const oldValue = localStorage.getItem(key);
        localStorage.removeItem(key);
        window.dispatchEvent(new StorageEvent("storage", { key, oldValue, newValue: null, storageArea: localStorage }));
      }
    }, keys);
    await page.waitForTimeout(3000);
    const b = await still(page, pin, "A6.png");
    say(`A6 auth lost via storage event (keys=${keys.length}): stable=${b.stable} ${brief(b.sp)}`);
  });

  // Network blip: context offline for a moment, then back. Still taken after reconnect.
  for (const ms of [3000, 12000]) {
    await withCtx(`BLIP${ms}`, async ({ context, pin, page, sockets, closes, sent }) => {
      await page.goto(`${base}/decks`, { timeout: 180_000 });
      const a = await still(page, pin, `blip${ms}-1.png`);
      const n0 = sent.length;
      await context.setOffline(true);
      await page.waitForTimeout(ms);
      const mid = pin.report();
      await context.setOffline(false);
      await page.waitForTimeout(4000);
      const b = await still(page, pin, `blip${ms}-2.png`);
      say(`BLIP ${ms}ms: before ${brief(a.sp)} | during offline report patched=${mid.patched} problems=${JSON.stringify(mid.problems)} | after: sockets=${sockets()} closes=${closes()} frames=${JSON.stringify(sent.slice(n0))} stable=${b.stable} jsClass=${await jsMode(page)} ${brief(b.sp)}`);
    });
  }
  // Real server-side drop: close the page's native socket to the Convex server (what a network drop or backend
  // restart delivers): Playwright's mock reports onCloseServer -> proxy server.onClose -> Convex client reconnects.
  const dropScript = () => {
    const W = globalThis.WebSocket as any;
    (globalThis as any).__probeSockets = [];
    globalThis.WebSocket = class extends W { constructor(...a: any[]) { super(...a); (globalThis as any).__probeSockets.push(this); } } as any;
  };
  const drop = (page: any) => page.evaluate(() => {
    const live = (globalThis as any).__probeSockets.filter((s: any) => /\/sync$/.test(s.url) && s.readyState === 1);
    for (const s of live) (globalThis as any).__pwWebSocketDispatch({ id: s._id, type: "closeServer", code: 1000, reason: "probe drop", wasClean: true });
    return live.length;
  });
  const syncCount = (page: any) => page.evaluate(() => (globalThis as any).__probeSockets.filter((s: any) => /\/sync$/.test(s.url)).length);
  await withCtx("DROP", async ({ context, pin, page }) => {
    await context.addInitScript(dropScript);
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    const a = await still(page, pin, "drop-1.png");
    const dropped = await drop(page);
    await page.waitForTimeout(300);
    const mid = pin.report();
    await page.waitForTimeout(5000);
    const b = await still(page, pin, "drop-2.png");
    say(`DROP still: before ${brief(a.sp)} | dropped=${dropped} mid patched=${mid.patched} | after reconnect: syncSockets=${await syncCount(page)} stable=${b.stable} jsClass=${await jsMode(page)} ${brief(b.sp)}`);
  });
  await withCtx("GIFDROP", async ({ context, pin, page }) => {
    await context.addInitScript(dropScript);
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const rec = recordFrames(page, [{ wait: 5000 }], pin.report);
    await page.waitForTimeout(1200);
    const dropped = await drop(page);
    const f = await rec;
    await page.waitForTimeout(500);
    const snaps = f.map((x: any) => x.snapshot);
    say(`GIFDROP server drop mid-GIF: dropped=${dropped} syncSockets=${await syncCount(page)} frames=${f.length} unpinned values=${JSON.stringify([...new Set(snaps.map((s: any) => s.unpinned))])} ${brief(shotPin([...snaps, pin.report()], appearance))}`);
  });
  // Drop, then the reconnect comes back signed out (cookies + storage cleared before the drop).
  await withCtx("DROPOUT", async ({ context, pin, page }) => {
    await context.addInitScript(dropScript);
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    await context.clearCookies();
    await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/convexAuth/i.test(k)) localStorage.removeItem(k); });
    await drop(page);
    await page.waitForTimeout(5000);
    const b = await still(page, pin, "dropout.png");
    say(`DROPOUT drop after clearing auth storage: syncSockets=${await syncCount(page)} signIn=${await page.locator("text=/sign in/i").count()} ${brief(b.sp)}`);
  });

  // Network blip during a GIF recording (conservative flag expected if the socket churned).
  await withCtx("GIFBLIP", async ({ context, pin, page, sockets, closes }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const frames = await recordFrames(page, [{ wait: 200 }], pin.report);
    await context.setOffline(true);
    // recordFrames already returned; record a second GIF spanning the blip
    const p2 = recordFrames(page, [{ wait: 6000 }], pin.report);
    await page.waitForTimeout(1500);
    await context.setOffline(false);
    const f2 = await p2;
    await page.waitForTimeout(500);
    const after = pin.report();
    const gp = shotPin([...f2.map((f: any) => f.snapshot), after], appearance);
    say(`GIFBLIP (offline 1.5s mid-GIF): pre-GIF frames clean=${!shotPin(frames.map((f: any) => f.snapshot), appearance).flagged}; sockets=${sockets()} closes=${closes()} frames=${f2.length} ${brief(gp)}`);
  });

  // Navigation within one shot spec: soft nav via a link click, then a hard nav (full page load) via location.assign.
  await withCtx("NAV", async ({ pin, page, sockets, closes }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const link = page.locator('a[href="/gallery"]').first();
    const hasLink = await link.count();
    if (hasLink) await link.click();
    const a = await still(page, pin, "nav-soft.png");
    say(`NAV soft (link click, found=${hasLink}): url=${new URL(page.url()).pathname} sockets=${sockets()} closes=${closes()} ${brief(a.sp)}`);
    await page.evaluate(() => location.assign("/decks"));
    await page.waitForURL(/\/decks/);
    const b = await still(page, pin, "nav-hard.png");
    say(`NAV hard (location.assign): url=${new URL(page.url()).pathname} sockets=${sockets()} closes=${closes()} jsClass=${await jsMode(page)} ${brief(b.sp)}`);
    await page.goto("about:blank");
    await page.waitForTimeout(1000);
    say(`NAV away to about:blank: closes=${closes()} report=${JSON.stringify(pin.report())}`);
  });
  // Hard nav while signed out in between (cookies+storage cleared, then a full navigation by a link-like step).
  await withCtx("NAVOUT", async ({ context, pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => location.assign("/gallery"));
    await page.waitForURL(/\/gallery/);
    const b = await still(page, pin, "navout.png");
    say(`NAVOUT hard nav after sign-out: url=${new URL(page.url()).pathname} ${brief(b.sp)}`);
  });
  // GIF whose steps trigger a hard navigation mid-recording.
  await withCtx("GIFNAV", async ({ pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const rec = recordFrames(page, [{ wait: 3000 }], pin.report);
    await page.waitForTimeout(500);
    await page.evaluate(() => location.assign("/gallery"));
    const f = await rec;
    await page.waitForTimeout(500);
    say(`GIFNAV hard nav mid-GIF: frames=${f.length} ${brief(shotPin([...f.map((x: any) => x.snapshot), pin.report()], appearance))}`);
  });

  // Multiple tabs in one context: a popup on /decks opens and closes; the original page's shot must stay correct.
  await withCtx("TABS", async ({ context, pin, page, sockets, closes }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const popup = await context.newPage();
    await popup.goto(`${base}/gallery`, { timeout: 180_000 });
    await settle(popup);
    const a = await still(page, pin, "tabs-open.png");
    say(`TABS popup open: sockets=${sockets()} ${brief(a.sp)}`);
    await popup.close();
    await page.waitForTimeout(500);
    const b = await still(page, pin, "tabs-closed.png");
    say(`TABS popup closed: closes=${closes()} ${brief(b.sp)}`);
    // Original page signs out by clearing storage + reload while a still-signed-in popup exists? Same context shares
    // storage, so a sign-out reaches both tabs: test whether the remaining tab hides the original page's miss.
    const popup2 = await context.newPage();
    await popup2.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(popup2);
    await page.goto("https://example.com/").catch(() => {});
    await page.waitForTimeout(1000);
    say(`TABS original page left the app, popup2 still on /decks: report=${JSON.stringify(pin.report())}`);
  });

  // Re-authentication on the same socket (what a token refresh delivers): storage event with the same JWT.
  await withCtx("REAUTH", async ({ pin, page, sent, sockets }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    const a = await still(page, pin, "reauth-1.png");
    const n0 = sent.length;
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage).filter((k) => k.includes("__convexAuthJWT"))) {
        const v = localStorage.getItem(key);
        window.dispatchEvent(new StorageEvent("storage", { key, oldValue: v, newValue: v, storageArea: localStorage }));
      }
    });
    await page.waitForTimeout(2000);
    const b = await still(page, pin, "reauth-2.png");
    say(`REAUTH same-token storage event: before ${brief(a.sp)} | frames after=${JSON.stringify(sent.slice(n0))} sockets=${sockets()} | after stable=${b.stable} jsClass=${await jsMode(page)} ${brief(b.sp)}`);
  });
} finally {
  await browser.close();
  say(`blocked writes: ${blocked.length} (${[...new Set(blocked)].join(", ")})`);
  fs.writeFileSync(path.join(out, `probe-log${only ? "-" + only.join("-") : ""}.md`), "```\n" + log.join("\n") + "\n```\n");
}
```
