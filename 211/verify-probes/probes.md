# PR #220 verifier probes (head 360bd65)

All harness files live outside the worktree. next dev on 8291; test reverse proxy on 8292. No Convex CLI. Writes dropped by the proxy.

## live6.ts output (real agentLogin / newCaptureContext / stableScreenshot / stillPin / shotPin)
```
L1 before: stable=true patched=true problems=[] FLAGGED=false
L1 after sign-out + reload: sockets=2 stable=true patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
L1: guard.problems() at end = []
L2 control reload signed in: stable=true html=aurora/light/expressive patched=true problems=[] FLAGGED=false
L2: guard.problems() at end = []
A6 auth lost via storage event (keys=1): stable=true patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
A6: guard.problems() at end = []
DROP: before patched=true problems=[] FLAGGED=false | dropped=1 mid patched=false | after reconnect: stable=true html=aurora/light/expressive patched=true problems=[] FLAGGED=false
DROP: guard.problems() at end = []
GIFDROP: dropped=1 frames=99 patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true
GIFDROP: guard.problems() at end = []
NAV soft (found=1): url=/gallery patched=true problems=[] FLAGGED=false
NAV hard: sockets=2 closes=0 html=aurora/light/expressive patched=true problems=[] FLAGGED=false
NAV about:blank: patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
NAV: guard.problems() at end = []
NAVOUT hard nav after sign-out: patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
NAVOUT: guard.problems() at end = []
GIFNAV hard nav mid-GIF: frames=46 patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true
GIFNAV: guard.problems() at end = []
REAUTH same-token storage event: stable=true patched=true problems=[] FLAGGED=false
REAUTH: guard.problems() at end = []
TWOPAGES: main only patched=true problems=[] FLAGGED=false | +popup patched=true problems=[] FLAGGED=false | main left app, popup html=aurora/light/expressive: patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
TWOPAGES: guard.problems() at end = []
POPUPNOSUB (popup never subscribes): patched=true problems=[] FLAGGED=false
POPUPNOSUB: guard.problems() at end = []
IFRAME same-origin /gallery: frames=["/decks","/gallery"] new sync sockets seen=1 getSession subs sent=2 patched=true problems=[] FLAGGED=false
IFRAME main frame not the app, iframe /decks: patched=true problems=[] FLAGGED=false (pin tracking is per page, so the iframe's subscription counts)
IFRAME: guard.problems() at end = []
IFRAMEXSITE: frames=["http://localhost:8291/decks","http://127.0.0.1:8292/__probe/xsite.html"] guard=[]
IFRAMEXSITE: guard.problems() at end = []
RELOAD mid-window: 6.6s sockets=2 closes=0 stable=true html=aurora/light/expressive patched=true problems=[] FLAGGED=false
RELOAD: guard.problems() at end = []
RELOADLATE: stable=true html=aurora/light/expressive patched=true problems=[] FLAGGED=false
RELOADLATE: guard.problems() at end = []
RELOADOUT mid-window, signed out: stable=true patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
RELOADOUT: guard.problems() at end = []
POPUPMAIN-A opener -> non-app page, popup on /decks (html=aurora/light/expressive): shot url=/__probe-no-app patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
POPUPMAIN-A: guard.problems() at end = []
POPUPMAIN-B opener -> /gallery (app): html=aurora/light/expressive patched=true problems=[] FLAGGED=false
POPUPMAIN-B: guard.problems() at end = []
POPUPMAIN-C opener window.close(): opener closed=false patched=true problems=[] FLAGGED=false
POPUPMAIN-C: guard.problems() at end = []
SIGNEDOUTSTART cookies=0 ls=0: patched=false problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true
SIGNEDOUTSTART: guard.problems() at end = []
DISTINCT: refresh-token hashes differ=false (non-empty=true)
agent sign-ins made by this probe: 22; blocked writes: 128 (Mutation:sessions:ensureAppearanceMigrated, Action:communityLive:refreshLiveStatus)
exit 0
```

## xsite.ts (cross-site iframe routing; distinct sessions, hashed)
```
DISTINCT: jwt sub (user|session) hash a=c0eff619d5 b=54a3b0bf60 differ=true; refresh cookie hashes differ=true (cookie names: __convexAuthJWT,__convexAuthRefreshToken)
xsite-oopif: frame mocked={"mocked":true,"ws":"class WebSocket extends WebSocketMock {\n"} newly blocked=["Mutation:probe:write"] page websocket events=["ws://127.0.0.1:8292/api/probe-xsite/sync","ws://127.0.0.1:8292/api/probe-xsite-write/sync"] guard=[]
samesite-control: frame mocked={"mocked":true,"ws":"class WebSocket extends WebSocketMock {\n"} newly blocked=["Mutation:probe:write"] page websocket events=["ws://127.0.0.1:8292/api/probe-xsite/sync","ws://127.0.0.1:8292/api/probe-xsite-write/sync"] guard=[]
```

## popupworker.ts (limit 3: worker started at document start in a window.open popup)
```
run 0 popup=/decks: shot page before popup guard=[]; after=["1 frame(s) (Connect ×1) were sent on a Convex WebSocket the capture proxy never saw (e.g. from a worker): its writes were not blocked and its session results were not rewritten","1 more Convex WebSocket(s) were opened than the capture proxy saw (e.g. from a worker)"]
run 1 popup=/gallery: same two problems
run 2 popup=/decks: same two problems
run 3 popup=/gallery: same two problems
run 4 popup=/decks: same two problems
```

## Rounds 1-5 unit replay (r6.ts = round-5 r5.ts retargeted to this head)
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

## l3b.ts (round-4 timeout path) through the real stillPin
```
L3b lag=150ms: returned after 30.1s, snapshots=70, stable=false, returned snapshot patched=true problems=[] FLAGGED(shotPin)=false REAL stillPin FLAGGED=true
L3b lag=600ms: returned after 30.2s, snapshots=71, stable=false, returned snapshot patched=true problems=[] FLAGGED(shotPin)=false REAL stillPin FLAGGED=true
(capture.ts judges stills with stillPin(at, stable), so the unsettled window is flagged.)
```

## Mutation checks (tests/pr-capture.test.ts)
```
Each mutation applied to the PR head, `bun test tests/pr-capture.test.ts` run, file restored with git checkout.
M1 page route removed (shot page falls back to the context route/pin): 60 pass, 4 fail (all 4 "capture context wiring" pin/route tests)
M2 count check off (opened > proxied ignored): 61 pass, 3 fail
M3 frame check off (unrecorded frames ignored): 60 pass, 4 fail
M6 sign-in context guard result dropped (agentLogin returns unproxied: []): 64 pass, 0 fail   <- survives
M8 SharedWorker init script not installed (binding still exposed): 64 pass, 0 fail          <- survives
(Both survivors are covered live instead: the vw-* runs show the "during sign-in:" problems and the SharedWorker problem.)
```

## Source: live6.ts
```
// Verifier probes for PR #220 (head 360bd65), against the PR's real browser.ts / pin.ts / gif.ts by absolute path.
// Every context uses the PR's own agentLogin (one sign-in each) and newCaptureContext's returned shot page.
// No Convex writes: the proxy drops Mutation/Action frames. "Signing out" here only clears this context's storage.
//   node live6.ts <port> [CASE,CASE...]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const WT = "file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-ac208bb82dc5d1433/";
const { chromium } = await import(WT + "node_modules/playwright/index.mjs");
const { agentLogin, newCaptureContext, settle, stableScreenshot } = await import(WT + "scripts/pr-capture/browser.ts");
const { recordFrames } = await import(WT + "scripts/pr-capture/gif.ts");
const { shotPin, stillPin } = await import(WT + "scripts/pr-capture/pin.ts");

process.loadEnvFile("C:/Projects/uvs-decks-gg/.claude/worktrees/agent-ac208bb82dc5d1433/.env.local");
const base = `http://localhost:${process.argv[2] ?? "8291"}`;
const only = process.argv[3]?.split(",");
const out = "C:/Users/xenos/AppData/Local/Temp/v220/live-out";
fs.mkdirSync(out, { recursive: true });
const log: string[] = [];
const say = (s: string) => { console.log(s); log.push(s); };
const brief = (p: { patched: boolean; problems: string[]; flagged: boolean }) =>
  `patched=${p.patched} problems=${JSON.stringify(p.problems)} FLAGGED=${p.flagged}`;
const appearance = { theme: "aurora", mode: "light" as const, chrome: "expressive" };
const NOAPP = "<!doctype html><title>probe</title><h1>No Convex client on this page</h1>";

const browser = await chromium.launch();
const blocked: string[] = [];
let logins = 0;

type Ctx = { context: any; pin: any; guard: any; page: any; sockets: () => number; closes: () => number; sent: string[]; state: any };
async function withCtx(name: string, fn: (ctx: Ctx) => Promise<void>, mutateState?: (s: any) => any) {
  if (only && !only.includes(name)) return;
  const login = await agentLogin(browser, base, blocked);
  logins++;
  if (login.unproxied.length) say(`${name}: sign-in guard: ${JSON.stringify(login.unproxied)}`);
  const state = mutateState ? mutateState(structuredClone(login.storageState)) : login.storageState;
  const { context, page, pin, guard } = await newCaptureContext(browser, { viewport: "desktop", appearance, storageState: state, blocked, still: true });
  let sockets = 0;
  let closes = 0;
  const sent: string[] = [];
  const watch = (pg: any) =>
    pg.on("websocket", (ws: any) => {
      if (!/\/sync$/.test(ws.url())) return;
      sockets++;
      ws.on("framesent", (f: any) => {
        if (typeof f.payload !== "string") return;
        const t = /"type":"(\w+)"/.exec(f.payload)?.[1];
        if (t === "ModifyQuerySet") sent.push(`MQS${/getSession/.test(f.payload) ? " +getSession" : ""}${/"Remove"/.test(f.payload) ? " Remove" : ""}`);
        else if (t === "Authenticate" || t === "Connect") sent.push(t);
      });
      ws.on("close", () => closes++);
    });
  watch(page);
  try {
    await fn({ context, pin, guard, page, sockets: () => sockets, closes: () => closes, sent, state });
  } catch (e) {
    say(`${name}: ERROR ${e instanceof Error ? e.message.split("\n")[0] : e}`);
  } finally {
    say(`${name}: guard.problems() at end = ${JSON.stringify(guard.problems())}`);
    await context.close();
  }
}
async function still(page: any, pin: any, file: string, during?: () => Promise<void>) {
  await settle(page);
  const pending = stableScreenshot(page, false, pin.report);
  if (during) await during();
  const r = await pending;
  fs.writeFileSync(path.join(out, file), r.png);
  return { ...r, sp: stillPin(r.at, r.stable, appearance) };
}
const html = (page: any) =>
  page.evaluate(() => {
    const r = document.documentElement;
    return `${r.getAttribute("data-color-theme")}/${r.classList.contains("dark") ? "dark" : "light"}/${r.getAttribute("data-chrome")}`;
  });
const noApp = (page: any) => page.route(`${base}/__probe-no-app`, (route: any) => route.fulfill({ contentType: "text/html", body: NOAPP }));

try {
  // ---------- Round-5 live cases, on the new API ----------
  await withCtx("L1", async ({ context, pin, page, sockets }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    const a = await still(page, pin, "L1-1.png");
    say(`L1 before: stable=${a.stable} ${brief(a.sp)}`);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.reload({ timeout: 180_000 });
    const b = await still(page, pin, "L1-2.png");
    say(`L1 after sign-out + reload: sockets=${sockets()} stable=${b.stable} ${brief(b.sp)}`);
  });
  await withCtx("L2", async ({ pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    await page.reload({ timeout: 180_000 });
    const b = await still(page, pin, "L2.png");
    say(`L2 control reload signed in: stable=${b.stable} html=${await html(page)} ${brief(b.sp)}`);
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
  await withCtx("DROP", async ({ context, pin, page }) => {
    await context.addInitScript(dropScript);
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    const a = await still(page, pin, "drop-1.png");
    const dropped = await drop(page);
    await page.waitForTimeout(300);
    const mid = pin.report();
    await page.waitForTimeout(5000);
    const b = await still(page, pin, "drop-2.png");
    say(`DROP: before ${brief(a.sp)} | dropped=${dropped} mid patched=${mid.patched} | after reconnect: stable=${b.stable} html=${await html(page)} ${brief(b.sp)}`);
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
    say(`GIFDROP: dropped=${dropped} frames=${f.length} ${brief(shotPin([...snaps, pin.report()], appearance))}`);
  });
  await withCtx("NAV", async ({ pin, page, sockets, closes }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const link = page.locator('a[href="/gallery"]').first();
    const hasLink = await link.count();
    if (hasLink) await link.click();
    const a = await still(page, pin, "nav-soft.png");
    say(`NAV soft (found=${hasLink}): url=${new URL(page.url()).pathname} ${brief(a.sp)}`);
    await page.evaluate(() => location.assign("/decks"));
    await page.waitForURL(/\/decks/);
    const b = await still(page, pin, "nav-hard.png");
    say(`NAV hard: sockets=${sockets()} closes=${closes()} html=${await html(page)} ${brief(b.sp)}`);
    await page.goto("about:blank");
    await page.waitForTimeout(1000);
    say(`NAV about:blank: ${brief(stillPin(pin.report(), true, appearance))}`);
  });
  await withCtx("NAVOUT", async ({ context, pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => location.assign("/gallery"));
    await page.waitForURL(/\/gallery/);
    const b = await still(page, pin, "navout.png");
    say(`NAVOUT hard nav after sign-out: ${brief(b.sp)}`);
  });
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
  await withCtx("REAUTH", async ({ pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage).filter((k) => k.includes("__convexAuthJWT"))) {
        const v = localStorage.getItem(key);
        window.dispatchEvent(new StorageEvent("storage", { key, oldValue: v, newValue: v, storageArea: localStorage }));
      }
    });
    await page.waitForTimeout(2000);
    const b = await still(page, pin, "reauth.png");
    say(`REAUTH same-token storage event: stable=${b.stable} ${brief(b.sp)}`);
  });

  // ---------- Item 1: per-page pin ----------
  await withCtx("TWOPAGES", async ({ context, pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    const a = await still(page, pin, "two-1.png");
    const popupP = context.waitForEvent("page");
    await page.evaluate(() => window.open("/decks"));
    const popup = await popupP;
    await popup.waitForLoadState();
    await settle(popup);
    await popup.waitForTimeout(1500);
    const b = await still(page, pin, "two-2.png");
    await noApp(page);
    await page.goto(`${base}/__probe-no-app`);
    await page.waitForTimeout(2500);
    const c = stillPin(pin.report(), true, appearance);
    fs.writeFileSync(path.join(out, "two-3-popup.png"), await popup.screenshot());
    say(`TWOPAGES: main only ${brief(a.sp)} | +popup ${brief(b.sp)} | main left app, popup html=${await html(popup)}: ${brief(c)}`);
  });
  await withCtx("POPUPNOSUB", async ({ context, pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const popupP = context.waitForEvent("page");
    await page.evaluate(() => window.open("/__probe-no-app"));
    const popup = await popupP;
    await popup.route(`${base}/__probe-no-app`, (r: any) => r.fulfill({ contentType: "text/html", body: NOAPP })).catch(() => {});
    await popup.waitForLoadState().catch(() => {});
    const b = await still(page, pin, "popupnosub.png");
    say(`POPUPNOSUB (popup never subscribes): ${brief(b.sp)}`);
  });

  // ---------- Adversarial ----------
  // A second Convex client in a same-origin iframe of the shot page.
  await withCtx("IFRAME", async ({ pin, page, sockets, sent }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const n0 = sockets();
    await page.evaluate(() => {
      const f = document.createElement("iframe");
      f.src = "/gallery";
      f.style.cssText = "position:fixed;right:0;bottom:0;width:640px;height:400px;z-index:99999;border:2px solid red";
      document.body.appendChild(f);
    });
    await page.waitForTimeout(8000);
    const b = await still(page, pin, "iframe.png");
    const frameUrls = page.frames().map((f: any) => new URL(f.url() || "about:blank").pathname);
    say(`IFRAME same-origin /gallery: frames=${JSON.stringify(frameUrls)} new sync sockets seen=${sockets() - n0} getSession subs sent=${sent.filter((s) => s.includes("getSession")).length} ${brief(b.sp)}`);
    // Main frame leaves the app; an iframe of the app remains in the page.
    await noApp(page);
    await page.route(`${base}/__probe-iframe-host`, (route: any) =>
      route.fulfill({ contentType: "text/html", body: `<!doctype html><h1>no app in main frame</h1><iframe src="/decks" style="width:1000px;height:600px"></iframe>` }),
    );
    await page.goto(`${base}/__probe-iframe-host`);
    await page.waitForTimeout(8000);
    const c = await still(page, pin, "iframe-host.png");
    say(`IFRAME main frame not the app, iframe /decks: ${brief(c.sp)} (pin tracking is per page, so the iframe's subscription counts)`);
  });
  // A cross-site iframe (OOPIF) that opens a Convex-shaped sync socket (served by revproxy on 8292; nothing reaches Convex).
  await withCtx("IFRAMEXSITE", async ({ pin, guard, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    await page.evaluate(() => {
      const f = document.createElement("iframe");
      f.src = "http://127.0.0.1:8292/__probe/xsite.html";
      document.body.appendChild(f);
    });
    await page.waitForTimeout(4000);
    const frames = page.frames().map((f: any) => f.url());
    say(`IFRAMEXSITE: frames=${JSON.stringify(frames.map((u: string) => u.replace(/token=[^&]+/, "token=<r>")))} guard=${JSON.stringify(guard.problems())}`);
  });
  // Reload during the stability window, signed in.
  await withCtx("RELOAD", async ({ pin, page, sockets, closes }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    const t0 = Date.now();
    const b = await still(page, pin, "reload.png", async () => {
      await page.waitForTimeout(800);
      await page.reload({ timeout: 180_000 });
    });
    say(`RELOAD mid-window: ${((Date.now() - t0) / 1000).toFixed(1)}s sockets=${sockets()} closes=${closes()} stable=${b.stable} html=${await html(page)} ${brief(b.sp)}`);
  });
  // Reload late in the window (just before the 2s quiet would end).
  await withCtx("RELOADLATE", async ({ pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    await page.waitForTimeout(3000);
    const b = await still(page, pin, "reloadlate.png", async () => {
      await page.waitForTimeout(1900);
      await page.evaluate(() => location.reload());
    });
    say(`RELOADLATE: stable=${b.stable} html=${await html(page)} ${brief(b.sp)}`);
  });
  // Reload during the window after the context lost its auth (signed out on reload).
  await withCtx("RELOADOUT", async ({ context, pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const b = await still(page, pin, "reloadout.png", async () => {
      await page.waitForTimeout(800);
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      await page.reload({ timeout: 180_000 });
    });
    say(`RELOADOUT mid-window, signed out: stable=${b.stable} ${brief(b.sp)}`);
  });
  // A popup that "becomes the main page": window.open, then the opener navigates away.
  await withCtx("POPUPMAIN-A", async ({ context, pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const popupP = context.waitForEvent("page");
    await page.evaluate(() => window.open("/decks"));
    const popup = await popupP;
    await popup.waitForLoadState();
    await settle(popup);
    await noApp(page);
    await page.evaluate(() => location.assign("/__probe-no-app"));
    await page.waitForURL(/__probe-no-app/);
    const b = await still(page, pin, "popupmain-a.png");
    say(`POPUPMAIN-A opener -> non-app page, popup on /decks (html=${await html(popup)}): shot url=${new URL(page.url()).pathname} ${brief(b.sp)}`);
  });
  await withCtx("POPUPMAIN-B", async ({ context, pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const popupP = context.waitForEvent("page");
    await page.evaluate(() => window.open("/gallery"));
    const popup = await popupP;
    await popup.waitForLoadState();
    await page.evaluate(() => location.assign("/gallery"));
    await page.waitForURL(/\/gallery/);
    const b = await still(page, pin, "popupmain-b.png");
    say(`POPUPMAIN-B opener -> /gallery (app): html=${await html(page)} ${brief(b.sp)}`);
  });
  await withCtx("POPUPMAIN-C", async ({ context, pin, page }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const popupP = context.waitForEvent("page");
    await page.evaluate(() => window.open("/decks"));
    const popup = await popupP;
    await popup.waitForLoadState();
    await page.evaluate(() => window.close());
    await page.waitForTimeout(1000);
    let res = `opener closed=${page.isClosed()}`;
    try {
      const b = await still(page, pin, "popupmain-c.png");
      res += ` ${brief(b.sp)}`;
    } catch (e) {
      res += ` still threw: ${e instanceof Error ? e.message.split("\n")[0] : e}`;
    }
    say(`POPUPMAIN-C opener window.close(): ${res}`);
  });
  // The per-shot sign-in yields a signed-out storage (as if sign-in silently failed).
  await withCtx("SIGNEDOUTSTART", async ({ pin, page, state }) => {
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    const b = await still(page, pin, "signedoutstart.png");
    say(`SIGNEDOUTSTART cookies=${state.cookies.length} ls=${state.origins.reduce((n: number, o: any) => n + o.localStorage.length, 0)}: ${brief(b.sp)}`);
  }, (s) => ({ cookies: [], origins: s.origins.map((o: any) => ({ ...o, localStorage: [] })) }));
  // Two sign-ins are distinct sessions (compare hashes only, never values).
  if (!only || only.includes("DISTINCT")) {
    const h = (s: any) => crypto.createHash("sha256").update(JSON.stringify(s.origins.flatMap((o: any) => o.localStorage.filter((e: any) => /RefreshToken/i.test(e.name)).map((e: any) => e.value)))).digest("hex").slice(0, 12);
    const a = await agentLogin(browser, base, blocked);
    const b = await agentLogin(browser, base, blocked);
    logins += 2;
    say(`DISTINCT: refresh-token hashes differ=${h(a.storageState) !== h(b.storageState)} (non-empty=${h(a.storageState) !== h({ origins: [] })})`);
  }
} finally {
  await browser.close();
  say(`agent sign-ins made by this probe: ${logins}; blocked writes: ${blocked.length} (${[...new Set(blocked)].join(", ")})`);
  fs.writeFileSync(path.join(out, `probe-log${only ? "-" + only.join("-") : ""}.md`), "```\n" + log.join("\n") + "\n```\n");
}
```

## Source: xsite.ts
```
// Focused probes: (1) is a cross-site iframe's Convex-shaped socket routed by the shot page's route, and seen by the guard?
// (2) are two agentLogin calls distinct Convex Auth sessions (compare hashed JWT sessionId claims only)?
import crypto from "node:crypto";
const WT = "file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-ac208bb82dc5d1433/";
const { chromium } = await import(WT + "node_modules/playwright/index.mjs");
const { agentLogin, newCaptureContext, settle } = await import(WT + "scripts/pr-capture/browser.ts");
process.loadEnvFile("C:/Projects/uvs-decks-gg/.claude/worktrees/agent-ac208bb82dc5d1433/.env.local");
const base = "http://localhost:8291";
const appearance = { theme: "aurora", mode: "light" as const, chrome: "expressive" };
const browser = await chromium.launch();
const blocked: string[] = [];
const h = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 10);
try {
  // (2) distinct sessions
  const sessionOf = (state: any) => {
    const jwt = state.origins.flatMap((o: any) => o.localStorage).find((e: any) => /__convexAuthJWT/.test(e.name))?.value;
    if (!jwt) return "none";
    const claims = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
    return h(String(claims.sub ?? ""));
  };
  const cookieOf = (state: any) => h(state.cookies.filter((c: any) => /refresh/i.test(c.name)).map((c: any) => c.value).join("|"));
  const a = await agentLogin(browser, base, blocked);
  const b = await agentLogin(browser, base, blocked);
  console.log(`DISTINCT: jwt sub (user|session) hash a=${sessionOf(a.storageState)} b=${sessionOf(b.storageState)} differ=${sessionOf(a.storageState) !== sessionOf(b.storageState)}; refresh cookie hashes differ=${cookieOf(a.storageState) !== cookieOf(b.storageState)} (cookie names: ${a.storageState.cookies.map((c: any) => c.name).join(",")})`);

  // (1) cross-site iframe
  for (const kind of ["xsite-oopif", "samesite-control"]) {
    const { context, page, guard } = await newCaptureContext(browser, { viewport: "desktop", appearance, storageState: a.storageState, blocked, still: true });
    const seen: string[] = [];
    page.on("websocket", (ws: any) => {
      seen.push(ws.url());
      ws.on("framesent", (f: any) => seen.push(`  sent ${String(f.payload).slice(0, 30)}`));
    });
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const before = blocked.length;
    // Same page served from a different site (127.0.0.1:8292) or the same site (localhost:8292, same-site cross-port).
    const host = kind === "xsite-oopif" ? "127.0.0.1" : "localhost";
    await page.evaluate((src: string) => {
      const f = document.createElement("iframe");
      f.src = src;
      document.body.appendChild(f);
    }, `http://${host}:8292/__probe/xsite.html`);
    await page.waitForTimeout(3000);
    const frame = page.frames().find((f: any) => f.url().includes("xsite"));
    const info = await frame?.evaluate(() => ({
      mocked: typeof (globalThis as any).__pwWebSocketDispatch === "function",
      ws: String(WebSocket).slice(0, 40),
    })).catch((e: any) => ({ error: String(e).slice(0, 80) }));
    // From the frame, send a write on a fresh Convex-shaped socket: is it blocked by the proxy?
    await frame?.evaluate((port: number) => new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/api/probe-xsite-write/sync`);
      ws.onopen = () => { ws.send(JSON.stringify({ type: "Mutation", requestId: 0, udfPath: "probe:write", args: [] })); setTimeout(resolve, 500); };
      ws.onerror = () => resolve();
    }), 8292).catch(() => {});
    await page.waitForTimeout(1500);
    console.log(`${kind}: frame mocked=${JSON.stringify(info)} newly blocked=${JSON.stringify(blocked.slice(before))} page websocket events=${JSON.stringify(seen.filter((s) => s.includes("probe")))} guard=${JSON.stringify(guard.problems())}`);
    await context.close();
  }
} finally {
  await browser.close();
}
```

## Source: popupworker.ts
```
// Limit 3: a popup (window.open) whose injected inline <head> script starts a dedicated worker that opens a
// Convex-shaped socket at once. Is it caught by the shot context's guard? Served via revproxy popupworker on 8292.
const WT = "file:///C:/Projects/uvs-decks-gg/.claude/worktrees/agent-ac208bb82dc5d1433/";
const { chromium } = await import(WT + "node_modules/playwright/index.mjs");
const { agentLogin, newCaptureContext, settle } = await import(WT + "scripts/pr-capture/browser.ts");
process.loadEnvFile("C:/Projects/uvs-decks-gg/.claude/worktrees/agent-ac208bb82dc5d1433/.env.local");
const base = "http://localhost:8292";
const appearance = { theme: "aurora", mode: "light" as const, chrome: "expressive" };
const browser = await chromium.launch();
const blocked: string[] = [];
try {
  const login = await agentLogin(browser, base, blocked);
  for (let i = 0; i < 5; i++) {
    const { context, page, guard } = await newCaptureContext(browser, { viewport: "desktop", appearance, storageState: login.storageState, blocked, still: true });
    await page.goto(`${base}/decks`, { timeout: 180_000 });
    await settle(page);
    const before = JSON.stringify(guard.problems());
    const popupP = context.waitForEvent("page");
    await page.evaluate((n: number) => window.open(n % 2 ? "/gallery" : "/decks"), i);
    const popup = await popupP;
    await popup.waitForLoadState().catch(() => {});
    await page.waitForTimeout(3000);
    console.log(`run ${i} popup=${new URL(popup.url()).pathname}: shot page before popup guard=${before}; after=${JSON.stringify(guard.problems())}`);
    await context.close();
  }
} finally {
  await browser.close();
}
```

## Source: revproxy.mjs
```
// Verifier's test-only reverse proxy on 8292 in front of `next dev` on 8291. App code untouched.
//   node revproxy.mjs <mode> [slowAuthMs]
// modes: none | dedicated | nested | silent | host | shared | service | popupworker
// - /api/<x>/sync upgrades are accepted here and never answered (nothing reaches Convex).
// - HTML responses get one injected <script> per mode.
// - slowAuthMs > 0 delays POST /api/agent-auth (the agent-login secret check) by that many ms.
// - /__probe/xsite.html is a page that opens a Convex-shaped sync socket from the document itself.
import crypto from "node:crypto";
import http from "node:http";
import net from "node:net";

const mode = process.argv[2] ?? "none";
const slowAuthMs = Number(process.argv[3] ?? 0);
const UPSTREAM = 8291;
const PORT = 8292;
const convexHost = process.env.PROBE_CONVEX_HOST ?? "";
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);

const connect = `JSON.stringify({ type: "Connect", sessionId: crypto.randomUUID(), connectionCount: 0, lastCloseReason: null })`;
const talk = (kind) => `
  const ws = new WebSocket("ws://127.0.0.1:${PORT}/api/probe-${kind}/sync");
  ws.onopen = () => ws.send(${connect});
`;
const files = {
  "/__probe/dedicated.js": talk("dedicated"),
  "/__probe/nested-outer.js": `new Worker("/__probe/nested-inner.js");`,
  "/__probe/nested-inner.js": talk("nested"),
  "/__probe/silent.js": `const ws = new WebSocket("ws://127.0.0.1:${PORT}/api/probe-silent/sync");`,
  "/__probe/host.js": `const ws = new WebSocket("wss://${convexHost}/verifier-probe-not-a-sync-path");`,
  "/__probe/shared.js": `${talk("shared")}\nonconnect = () => {};`,
  "/__probe/sw.js": `self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => { ${talk("service")} });`,
};
const inject = {
  none: "",
  dedicated: `<script>new Worker("/__probe/dedicated.js")</script>`,
  nested: `<script>new Worker("/__probe/nested-outer.js")</script>`,
  silent: `<script>new Worker("/__probe/silent.js")</script>`,
  host: `<script>new Worker("/__probe/host.js")</script>`,
  shared: `<script>new SharedWorker("/__probe/shared.js")</script>`,
  service: `<script>navigator.serviceWorker && navigator.serviceWorker.register("/__probe/sw.js", { scope: "/__probe/" })</script>`,
  // Worker only in popups (window.opener set), started as early as possible.
  popupworker: `<script>if (window.opener) new Worker("/__probe/dedicated.js")</script>`,
}[mode];
if (inject === undefined) throw new Error(`unknown mode ${mode}`);

const xsite = `<!doctype html><title>xsite</title><h1>cross-site frame</h1><script>
  const ws = new WebSocket("ws://127.0.0.1:${PORT}/api/probe-xsite/sync");
  ws.onopen = () => ws.send(${connect});
</script>`;

const server = http.createServer(async (req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  if (files[p] !== undefined) {
    res.writeHead(200, { "content-type": "text/javascript", "service-worker-allowed": "/" }).end(files[p]);
    return;
  }
  if (p === "/__probe/xsite.html") {
    res.writeHead(200, { "content-type": "text/html" }).end(xsite);
    return;
  }
  if (slowAuthMs && p === "/api/agent-auth") {
    log(`delaying /api/agent-auth by ${slowAuthMs}ms`);
    await new Promise((r) => setTimeout(r, slowAuthMs));
  }
  const headers = { ...req.headers };
  delete headers["accept-encoding"];
  const upstream = http.request({ host: "127.0.0.1", port: UPSTREAM, method: req.method, path: req.url, headers }, (up) => {
    const html = (up.headers["content-type"] ?? "").includes("text/html");
    if (!html || !inject) {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
      return;
    }
    const chunks = [];
    up.on("data", (c) => chunks.push(c));
    up.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8").replace("<head>", `<head>${inject}`);
      const out = { ...up.headers };
      delete out["content-length"];
      delete out["transfer-encoding"];
      res.writeHead(up.statusCode ?? 502, out);
      res.end(body);
      log("injected", mode, "into", p);
    });
  });
  upstream.on("error", () => res.headersSent || res.writeHead(502).end());
  req.on("aborted", () => upstream.destroy());
  req.pipe(upstream);
});

server.on("upgrade", (req, socket, head) => {
  if (/^\/api\/[^/]+\/sync$/.test(new URL(req.url, "http://x").pathname)) {
    const accept = crypto.createHash("sha1").update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    socket.on("error", () => {});
    log("probe sync socket accepted", req.url);
    return;
  }
  const up = net.connect(UPSTREAM, "127.0.0.1", () => {
    up.write(`${req.method} ${req.url} HTTP/1.1\r\n${Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n")}\r\n\r\n`);
    if (head?.length) up.write(head);
    socket.pipe(up).pipe(socket);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

server.listen(PORT, "127.0.0.1", () => log(`revproxy ${mode} slowAuth=${slowAuthMs} on ${PORT} -> ${UPSTREAM}`));
```

## Source: run-modes.sh
```
#!/usr/bin/env bash
# For each mode: start revproxy on 8292 (-> 8291), run the real capture CLI through it with --strict, record exit, stop proxy.
V=/c/Users/xenos/AppData/Local/Temp/v220
WT=/c/Projects/uvs-decks-gg/.claude/worktrees/agent-ac208bb82dc5d1433
export PROBE_CONVEX_HOST=$(node -e 'process.loadEnvFile(process.argv[1]); console.log(new URL(process.env.NEXT_PUBLIC_CONVEX_URL).host)' "$WT/.env.local")
for mode in "$@"; do
  node $V/revproxy.mjs $mode > $V/logs/revproxy-$mode.log 2>&1 &
  RP=$!
  sleep 1
  (cd $WT && node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue 211 --label vw-$mode \
    --routes decks,guest:gallery --viewports desktop --themes default --modes dark --strict --port 8292) > $V/logs/vw-$mode.log 2>&1
  echo "exit $?" >> $V/logs/vw-$mode.log
  kill $RP 2>/dev/null; wait $RP 2>/dev/null
  echo "== $mode: $(tail -1 $V/logs/vw-$mode.log) injected=$(grep -c injected $V/logs/revproxy-$mode.log) probeSockets=$(grep -c 'probe sync socket' $V/logs/revproxy-$mode.log)"
done
```

## Source: run-slow.sh
```
#!/usr/bin/env bash
# Sign-in failure modes through the real CLI. Arg: label slowMs [badsecret]
V=/c/Users/xenos/AppData/Local/Temp/v220
WT=/c/Projects/uvs-decks-gg/.claude/worktrees/agent-ac208bb82dc5d1433
label=$1; ms=$2; bad=$3
node $V/revproxy.mjs none $ms > $V/logs/revproxy-$label.log 2>&1 &
RP=$!
sleep 1
start=$(date +%s)
if [ -n "$bad" ]; then export AGENT_AUTH_SECRET=verifier-wrong-secret-value; fi
(cd $WT && node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue 211 --label vs-$label \
  --routes decks,gallery --viewports desktop --themes default --modes dark --strict --port 8292) > $V/logs/vs-$label.log 2>&1
code=$?
echo "exit $code after $(( $(date +%s) - start ))s" >> $V/logs/vs-$label.log
kill $RP 2>/dev/null; wait $RP 2>/dev/null
echo "== $label: $(tail -1 $V/logs/vs-$label.log); delays=$(grep -c delaying $V/logs/revproxy-$label.log); manifest=$( [ -f $WT/.pr-captures/211/vs-$label/manifest.json ] && echo yes || echo no )"
```

## Source: signout.spec.json
```
{
  "routes": [
    {
      "path": "/gallery",
      "auth": "agent",
      "name": "a-signs-out",
      "viewports": ["desktop"],
      "steps": [
        { "click": "[data-slot=\"dropdown-menu-trigger\"]:has-text(\"agent\")" },
        { "click": "role=menuitem[name=\"Log out\"]" },
        { "wait": 3000 }
      ]
    },
    { "path": "/decks", "auth": "agent", "name": "b-after-signout", "viewports": ["desktop"] },
    {
      "path": "/decks",
      "auth": "agent",
      "name": "c-signs-out-again",
      "viewports": ["desktop"],
      "steps": [
        { "click": "[data-slot=\"dropdown-menu-trigger\"]:has-text(\"agent\")" },
        { "click": "role=menuitem[name=\"Log out\"]" },
        { "wait": 3000 }
      ]
    },
    { "path": "/gallery", "auth": "agent", "name": "d-after-second-signout", "viewports": ["desktop"] }
  ],
  "gif": {
    "path": "/decks",
    "auth": "agent",
    "name": "e-gif-after",
    "viewport": "desktop",
    "theme": "default",
    "mode": "dark",
    "steps": [{ "wait": 1500 }]
  }
}
```
