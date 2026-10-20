# Console output: `verify-broken` (independent verifier, PR #198)

```text
$ node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue "197" --label verify-broken --port "8221" --spec ".pr-captures/v198.spec.json" --themes aurora --modes light
PR_CAPTURE_TEST_BREAK_PIN=1: the session rewrite is deliberately broken (test only).
Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset `default` (CSS still follows the pin; mode follows colorScheme emulation).
Reusing server on http://localhost:8221
Capturing #197 "verify-broken" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-ac08885044bcf4915\.pr-captures\197\verify-broken
  usermenu__desktop__aurora__light.png
    WARNING: JS theme pin may not apply: no sessions:getSession subscription was seen (renamed, or the page isn't signed in)
  copy-link-toast__desktop__aurora__light.png
    WARNING: JS theme pin may not apply: no sessions:getSession subscription was seen (renamed, or the page isn't signed in)
  guest-gallery__desktop__aurora__light.png
Done: 3 stills. Blocked Convex writes: Mutation:sessions:ensureAppearanceMigrated ×3, Action:communityLive:refreshLiveStatus ×6
Agent's saved appearance (preset/mode/chrome): unknown. Session result rewritten in 0/2 signed-in shots (0 differ from saved).
WARNING: 2 signed-in shot(s) may show the agent's saved theme in JS-driven UI (menus, toasts, neon forks) instead of the pin: usermenu__desktop__aurora__light, copy-link-toast__desktop__aurora__light. See `pin.problems` in manifest.json.
exit=0
```
