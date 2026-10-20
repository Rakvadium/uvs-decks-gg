# Verifier probes (rounds 2-4) against `pin.ts` after Follow-up 4

All five probes import the real `pin.ts`/`browser.ts` from this worktree by absolute path, and they run from outside the worktree. Adaptations, each mirroring what the capture code now does:
- `r4.ts`: B2, B3, B3b and B4 call `a.close()` before the reconnect, which is what `ws.onClose`/`server.onClose` now trigger. B6 includes the snapshot taken after recording, which `captureGif` now takes.
- `live.ts` and `l3b.ts`: stills are judged with the exported `stillPin(at, stable, appearance)`, which `captureStill` uses.
- `r3.ts`: uses the real `shotPin`. Its GIF probes A2c and A2d pass every frame.
- `m1.ts`: unchanged.

`r4.ts` ends with `unexpected outcomes: 0`.

## r4.ts (round 4)

```text
=== Regression: rounds 1-3 (real shotPin) ===
ok   R1a subscribed, no result
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R1b QueryResult instead of QueryUpdated
      patched=false saved=null problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R1c TransitionV2 frame
      patched=false saved=null problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R1d modifications renamed
      patched=false saved=null problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-E1 pin==saved, no result
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-E2 pin==saved, null
      patched=false saved=null problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-E3 pin==saved, never subscribed
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   R2-E4 pin==saved, QueryFailed
      patched=false saved=null problems=["sessions:getSession failed: boom","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2 S1 partial shape (theme only)
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome/colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2 array value
      patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2 renamed client ModifyQuerySet
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   R2 patched then null
      patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-X2 reconnect, s2 result in TransitionV2
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-X3 second sub, no result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-X4 second sub, QueryResult type
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2-X5 later update renamed type
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   R2 binary frame after subscribe
      patched=true saved=cyberpunk/dark/expressive problems=["a binary sync frame was forwarded unpatched (protocol changed?)"] FLAGGED=true (expected true)
ok   R2 Transition without modifications
      patched=true saved=cyberpunk/dark/expressive problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)"] FLAGGED=true (expected true)
ok   R3-A5a provider never mounted (socket, no Add)
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   R3-A5b no Convex socket at all
      patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true (expected true)
ok   R3-A6a client Remove, no re-Add
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   R3-A6b server QueryRemoved, no re-Add
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   R3-A6c Add then Remove before any result
      patched=false saved=null problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   R3-A6d GIF: clean first frame, Remove before last
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   R3-A2c GIF: Remove+Add pending in middle frame
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   R3-A2d GIF: skip in middle, re-Add+rewrite by last
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)
ok   R3-A1a good result after snapshot (that snapshot)
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)  [conservative]
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
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1b re-Added after removal (same id), no result
      patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1c re-Added after removal, result in QueryResult
      patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B1d server QueryRemoved, then re-Add, null result
      patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B2 reconnect: old socket clean, new socket never re-subscribes (reload signed out / provider gone)
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)  [old socket's entry still counts as live]
ok   B3 reconnect (AuthError restart): s2 re-Adds then Removes (token refresh failed -> skip)
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)  [A6 again, after a reconnect]
ok   B3b reconnect: s2 re-Adds, server QueryRemoved on s2
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true (expected true)
ok   B4 old socket pending at close, new socket rewritten (false-alarm check)
      patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false (expected false)  [a correct page]
ok   B5 GIF: Remove+Add+rewrite all between two frame snapshots
      patched=true saved=cyberpunk/dark/expressive problems=["the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)  [snapshots identical: false; a frame between could show defaults]
ok   B6 GIF: Remove reaches Node after the last frame's snapshot (page already rendered skip)
      patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true (expected true)  [after-recording snapshot included, as captureGif now does]
ok   B7a shotPin([])
      patched=false saved=null problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7b shotPin([undefined])
      patched=false saved=null problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7c shotPin([clean, undefined])
      patched=false saved=cyberpunk/dark/expressive problems=["no pin snapshot was taken for an image"] FLAGGED=true (expected true)
ok   B7d hand-built patched:false, problems:[]
      patched=false saved=x/dark/calm problems=["the session result was not rewritten when the image was taken"] FLAGGED=true (expected true)
ok   B8 chunked transition never completes
      patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B9 chunked transition, totalParts missing
      patched=false saved=null problems=["a chunked transition couldn't be reassembled and was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true (expected true)
ok   B10 same id twice in one Transition: null then valid
      patched=true saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite"] FLAGGED=true (expected true)

unexpected outcomes: 0
```

## live.ts (round 4, L1-L3)

```text
L1 BEFORE url=/decks sockets=2 patched=true saved=cyberpunk/dark/expressive problems=[] FLAGGED=false
L1 AFTER  url=/decks sockets=4 stable=true sign-in links=5 patched=false saved=cyberpunk/dark/expressive problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
ModifyQuerySet frames (args/values redacted):
  socket2: {"type":"ModifyQuerySet","baseVersion":1,"newVersion":2,"modifications":[{"type":"Add","queryId":3,"udfPath":"sessions:getSession","args":<redacted>}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":8,"newVersion":9,"modifications":[{"type":"Remove","queryId":9}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":9,"newVersion":10,"modifications":[{"type":"Remove","queryId":5}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":10,"newVersion":11,"modifications":[{"type":"Remove","queryId":6}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":11,"newVersion":12,"modifications":[{"type":"Remove","queryId":4}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":12,"newVersion":13,"modifications":[{"type":"Remove","queryId":7}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":13,"newVersion":14,"modifications":[{"type":"Remove","queryId":8}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":20,"newVersion":21,"modifications":[{"type":"Remove","queryId":1}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":26,"newVersion":27,"modifications":[{"type":"Remove","queryId":20}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":28,"newVersion":29,"modifications":[{"type":"Remove","queryId":16}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":29,"newVersion":30,"modifications":[{"type":"Remove","queryId":17}]}
  socket2: {"type":"ModifyQuerySet","baseVersion":30,"newVersion":31,"modifications":[{"type":"Remove","queryId":18}]}
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
L3 never-settling pin: returned after 30.4s, snapshots=73, stable=false, patched=false saved=cyberpunk/dark/expressive problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)","the image and pin state never stayed unchanged for the full stability window (30s ran out)"] FLAGGED=true  (png saved; DOM now=PINNED)
blocked writes: 12 (Mutation:sessions:ensureAppearanceMigrated, Action:communityLive:refreshLiveStatus)
```

## l3b.ts (round 4)

```text
L3b lag=150ms: returned after 30.4s, snapshots=73, stable=false, returned snapshot patched=true problems=["the image and pin state never stayed unchanged for the full stability window (30s ran out)"] FLAGGED=true; png -> C:/Users/xenos/AppData/Local/Temp/197/probes/live-out/L3b-lag150.png
L3b lag=600ms: returned after 30.4s, snapshots=73, stable=false, returned snapshot patched=true problems=["the image and pin state never stayed unchanged for the full stability window (30s ran out)"] FLAGGED=true; png -> C:/Users/xenos/AppData/Local/Temp/197/probes/live-out/L3b-lag600.png
```

## r3.ts (round 3)

```text
=== Regression (round 1 + round 2) ===
R1a subscribed, no result
    patched=false saved=null overridden=false problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R1b QueryResult instead of QueryUpdated
    patched=false saved=null overridden=false problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R1c TransitionV2 frame
    patched=false saved=null overridden=false problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R1d modifications renamed
    patched=false saved=null overridden=false problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-E1 pin==saved, no result
    patched=false saved=null overridden=false problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-E2 pin==saved, null
    patched=false saved=null overridden=false problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-E3 pin==saved, never subscribed
    patched=false saved=null overridden=false problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true
R2-E4 pin==saved, QueryFailed
    patched=false saved=null overridden=false problems=["sessions:getSession failed: boom","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-X2 reconnect, s2 result in TransitionV2
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-X3 second sub, no result
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-X4 second sub, QueryResult type
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2-X5 later update renamed type
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
R2 binary frame after subscribe
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=["a binary sync frame was forwarded unpatched (protocol changed?)"] FLAGGED=true
R2 Transition without modifications
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)"] FLAGGED=true
CTRL clean + Ping (must NOT flag)
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=[] FLAGGED=false

=== Adversarial (round 3) ===
A1a good result lands after snapshot, before png
    patched=false saved=null overridden=false problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true  [conservative]
A1b null lands after snapshot, before png: that snapshot
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=[] FLAGGED=false
A1b ... any later snapshot
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true  [problem is sticky]
A2a GIF: mid-GIF null then good
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=["sessions:getSession returned null, so there was nothing to rewrite","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true
A2b GIF: mid-GIF unknown type then good
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true
A2c GIF: mid-GIF Remove+Add, pending in middle, rewritten by last
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true  [every frame consulted]
A2d GIF: mid-GIF skip (Remove only), then re-Add+rewrite
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true  [middle report: patched=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] flagged=true]
A3 two contexts: ctx A clean
    patched=true saved=cyberpunk/dark/expressive overridden=true problems=[] FLAGGED=false
A3 two contexts: ctx B no result
    patched=false saved=null overridden=false problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
A3b ctx A second page/socket pending
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true
A4 valid shape, other user's prefs
    patched=true saved=noir/light/calm overridden=true problems=[] FLAGGED=false  [forwarded = aurora/light/calm, userId=u9]
A5a provider never mounted (socket, no Add)
    patched=false saved=null overridden=false problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true
A5b no Convex socket at all
    patched=false saved=null overridden=false problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] FLAGGED=true
A6a client Remove (useQuery -> 'skip'), no re-Add before shot
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
A6b server QueryRemoved, no re-Add before shot
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
A6c Add then Remove before any result
    patched=false saved=null overridden=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"] FLAGGED=true
A6d GIF: clean first frame, Remove before last frame
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)","the session pin was not fully applied at some point between snapshots (subscription churn or a gap)"] FLAGGED=true
```

## m1.ts (round 2)

```text
M1a no result before shot
    patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1b QueryResult instead of QueryUpdated
    patched=false saved=null problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1c unknown frame type
    patched=false saved=null problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1d modifications key renamed
    patched=false saved=null problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1a + runSaved (other shots read saved)
    patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=cyberpunk/dark/expressive FLAGGED=true
S1 partial shape (only theme kept)
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome/colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 partial shape (theme+chrome kept)
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 custom colorSource
    patched=true saved=custom/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
S1 empty chrome
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 preset empty string
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X1 reconnect: s1 patched, s2 resubscribes, no result
    patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X2 reconnect: s1 patched, s2 result in new frame type
    patched=false saved=cyberpunk/dark/expressive problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
    X2b forwarded theme: light
X2b reconnect: s2 result normal
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X3 two subs same socket, one patched, other no result
    patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X4 two subs, one patched, other QueryResult type
    patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 2 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X5 patched, later update uses renamed type
    patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X6 patched then null
    patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X7 sessions.js:getSession path
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
    X8 forwarded theme: light
X8 batched Add + chunk interleaved with Ping
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X9 value array
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X10 value string
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X11 Add frame arrives as non-ModifyQuerySet (e.g. renamed client frame)
    patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] pin=aurora/light/calm runSaved=null FLAGGED=true
E1 pin==saved, no result (unpatched JS = app defaults)
    patched=false saved=null problems=["1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=true
E2 pin==saved, result null
    patched=false saved=null problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=true
E3 pin==saved, never subscribed
    patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=true
E4 pin==saved, QueryFailed
    patched=false saved=null problems=["sessions:getSession failed: boom","1 of 1 live sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=true
```
