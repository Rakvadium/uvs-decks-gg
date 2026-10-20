# Console output: `broken-saved-strict`

```text
$ node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue "197" --label broken-saved-strict --port "8131" --strict --spec "C:/Users/xenos/AppData/Local/Temp/197/pin.spec.json" --themes cyberpunk --modes dark --chrome expressive
PR_CAPTURE_TEST_BREAK_PIN=1: the session rewrite is deliberately broken (test only).
Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset `default` (CSS still follows the pin; mode follows colorScheme emulation).
Reusing server on http://localhost:8131
Capturing #197 "broken-saved-strict" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-a7c2c12f972519251\.pr-captures\197\broken-saved-strict
  pin-usermenu__desktop__cyberpunk__dark.png
    WARNING: JS theme pin may not apply: no sessions:getSession subscription was seen (renamed, or the page isn't signed in)
  copy-link-toast__desktop__cyberpunk__dark.png
    WARNING: JS theme pin may not apply: no sessions:getSession subscription was seen (renamed, or the page isn't signed in)
  guest-gallery__desktop__cyberpunk__dark.png
Done: 3 stills. Blocked Convex writes: Action:communityLive:refreshLiveStatus ×8, Mutation:sessions:ensureAppearanceMigrated ×2
Agent's saved appearance (preset/mode/chrome): unknown. Session result rewritten in 0/2 signed-in shots (0 differ from saved).
WARNING: 2 signed-in shot(s) may show the agent's saved theme or the app defaults in JS-driven UI (menus, toasts, neon forks) instead of the pin: pin-usermenu__desktop__cyberpunk__dark, copy-link-toast__desktop__cyberpunk__dark. See `pin.problems` in manifest.json.
--strict: failing because the JS theme pin did not apply to every signed-in shot.
error: script "capture" exited with code 1
```
