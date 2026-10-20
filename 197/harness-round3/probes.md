# Round-2 verifier harness (`m1.ts`) against `pin.ts` after Follow-up 2

The harness passes a third `runSaved` argument to `pinFlagged`. That argument is now ignored, because any problem flags the shot.

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
