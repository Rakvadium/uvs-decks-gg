# Verifier probes against `pin.ts` after Follow-up 3

`r3.ts` now imports the real exported `shotPin` instead of its copy of the old capture.ts logic. Its GIF probes A2c and A2d pass every frame, because capture.ts now does. `m1.ts` is the round-2 harness, unchanged.

## r3.ts (round 3)

```text
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
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] FLAGGED=true  [every frame consulted]
A2d GIF: mid-GIF skip (Remove only), then re-Add+rewrite
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true  [middle report: patched=false problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] flagged=true]
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
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true
A6b server QueryRemoved, no re-Add before shot
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true
A6c Add then Remove before any result
    patched=false saved=null overridden=false problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true
A6d GIF: clean first frame, Remove before last frame
    patched=false saved=cyberpunk/dark/expressive overridden=false problems=["every sessions:getSession subscription was removed (signed out, or the provider unmounted)"] FLAGGED=true
```

## m1.ts (round 2)

```text
M1a no result before shot
    patched=false saved=null problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1b QueryResult instead of QueryUpdated
    patched=false saved=null problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1c unknown frame type
    patched=false saved=null problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1d modifications key renamed
    patched=false saved=null problems=["a Transition without a `modifications` list was forwarded unpatched (protocol changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1a + runSaved (other shots read saved)
    patched=false saved=null problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=cyberpunk/dark/expressive FLAGGED=true
S1 partial shape (only theme kept)
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome/colorSource (shape changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 partial shape (theme+chrome kept)
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid colorSource (shape changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 custom colorSource
    patched=true saved=custom/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
S1 empty chrome
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome (shape changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 preset empty string
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid colorSource (shape changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X1 reconnect: s1 patched, s2 resubscribes, no result
    patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X2 reconnect: s1 patched, s2 result in new frame type
    patched=false saved=cyberpunk/dark/expressive problems=["unrecognised sync frame type \"TransitionV2\" was forwarded unpatched","1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
    X2b forwarded theme: light
X2b reconnect: s2 result normal
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X3 two subs same socket, one patched, other no result
    patched=false saved=cyberpunk/dark/expressive problems=["1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X4 two subs, one patched, other QueryResult type
    patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 2 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X5 patched, later update uses renamed type
    patched=false saved=cyberpunk/dark/expressive problems=["unrecognised modification type \"QueryResult\" for sessions:getSession was forwarded unpatched","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X6 patched then null
    patched=false saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X7 sessions.js:getSession path
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
    X8 forwarded theme: light
X8 batched Add + chunk interleaved with Ping
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X9 value array
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X10 value string
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X11 Add frame arrives as non-ModifyQuerySet (e.g. renamed client frame)
    patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] pin=aurora/light/calm runSaved=null FLAGGED=true
E1 pin==saved, no result (unpatched JS = app defaults)
    patched=false saved=null problems=["1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=true
E2 pin==saved, result null
    patched=false saved=null problems=["sessions:getSession returned null, so there was nothing to rewrite","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=true
E3 pin==saved, never subscribed
    patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=true
E4 pin==saved, QueryFailed
    patched=false saved=null problems=["sessions:getSession failed: boom","1 of 1 sessions:getSession subscription(s) had no rewritten result (none arrived yet, or the sync protocol changed)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=true
```
