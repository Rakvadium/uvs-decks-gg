```
PR_CAPTURE_TEST_BREAK_PIN=1: the session rewrite is deliberately broken (test only).
Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset `default` (CSS still follows the pin; mode follows colorScheme emulation).
Reusing server on http://localhost:8271
Capturing #197 "verify6-broken" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-a5fb8de1fac79aa91\.pr-captures\197\verify6-broken
  decks__desktop__cyberpunk__dark.png
    WARNING: JS theme pin may not apply: no sessions:getSession subscription was seen (renamed, or the page isn't signed in)
  guest-gallery__desktop__cyberpunk__dark.png
Done: 2 stills. Blocked Convex writes: Action:communityLive:refreshLiveStatus ×6, Mutation:sessions:ensureAppearanceMigrated ×1
Agent's saved appearance (preset/mode/chrome): unknown. Session result rewritten in 0/1 signed-in shots (0 differ from saved).
WARNING: 1 signed-in shot(s) may show the agent's saved theme or the app defaults in JS-driven UI (menus, toasts, neon forks) instead of the pin: decks__desktop__cyberpunk__dark. See `pin.problems` in manifest.json.
--strict: failing because the JS theme pin did not apply to every signed-in shot.
error: script "capture" exited with code 1

EXIT 1
```
