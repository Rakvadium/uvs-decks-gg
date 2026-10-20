```
PR_CAPTURE_TEST_BREAK_PIN=1: the session rewrite is deliberately broken (test only).
Starting next dev on http://localhost:8252 (log: C:\Projects\uvs-decks-gg\.claude\worktrees\agent-ab72ebca03235f686\.pr-captures\197\verify4-broken\next-dev.log)
Capturing #197 "verify4-broken" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-ab72ebca03235f686\.pr-captures\197\verify4-broken
  decks__desktop__cyberpunk__dark.png
    WARNING: JS theme pin may not apply: no sessions:getSession subscription was seen (renamed, or the page isn't signed in)
Done: 1 stills. Blocked Convex writes: Mutation:sessions:ensureAppearanceMigrated ×2, Action:communityLive:refreshLiveStatus ×2
Agent's saved appearance (preset/mode/chrome): unknown. Session result rewritten in 0/1 signed-in shots (0 differ from saved).
WARNING: 1 signed-in shot(s) may show the agent's saved theme or the app defaults in JS-driven UI (menus, toasts, neon forks) instead of the pin: decks__desktop__cyberpunk__dark. See `pin.problems` in manifest.json.
--strict: failing because the JS theme pin did not apply to every signed-in shot.
error: script "capture" exited with code 1
```
