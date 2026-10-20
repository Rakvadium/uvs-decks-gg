$ node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue "197" --label "verify5-broken" --port "8261" --strict --routes decks --themes cyberpunk --modes dark --chrome expressive --viewports desktop
PR_CAPTURE_TEST_BREAK_PIN=1: the session rewrite is deliberately broken (test only).
Reusing server on http://localhost:8261
Capturing #197 "verify5-broken" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-a803a271b490d114c\.pr-captures\197\verify5-broken
  decks__desktop__cyberpunk__dark.png
    WARNING: JS theme pin may not apply: no sessions:getSession subscription was seen (renamed, or the page isn't signed in)
Done: 1 stills. Blocked Convex writes: Action:communityLive:refreshLiveStatus ×4, Mutation:sessions:ensureAppearanceMigrated ×1
Agent's saved appearance (preset/mode/chrome): unknown. Session result rewritten in 0/1 signed-in shots (0 differ from saved).
WARNING: 1 signed-in shot(s) may show the agent's saved theme or the app defaults in JS-driven UI (menus, toasts, neon forks) instead of the pin: decks__desktop__cyberpunk__dark. See `pin.problems` in manifest.json.
--strict: failing because the JS theme pin did not apply to every signed-in shot.
error: script "capture" exited with code 1
