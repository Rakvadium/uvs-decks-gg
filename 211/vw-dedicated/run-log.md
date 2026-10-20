```
Reusing server on http://localhost:8292
Capturing #211 "vw-dedicated" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-ac208bb82dc5d1433\.pr-captures\211\vw-dedicated
  decks__desktop__default__dark.png
    WARNING: Convex socket outside the capture proxy: during sign-in: 1 frame(s) (Connect ×1) were sent on a Convex WebSocket the capture proxy never saw (e.g. from a worker): its writes were not blocked and its session results were not rewritten; during sign-in: 1 more Convex WebSocket(s) were opened than the capture proxy saw (e.g. from a worker); 1 frame(s) (Connect ×1) were sent on a Convex WebSocket the capture proxy never saw (e.g. from a worker): its writes were not blocked and its session results were not rewritten; 1 more Convex WebSocket(s) were opened than the capture proxy saw (e.g. from a worker)
  guest-gallery__desktop__default__dark.png
    WARNING: Convex socket outside the capture proxy: 1 frame(s) (Connect ×1) were sent on a Convex WebSocket the capture proxy never saw (e.g. from a worker): its writes were not blocked and its session results were not rewritten; 1 more Convex WebSocket(s) were opened than the capture proxy saw (e.g. from a worker)
Done: 2 stills. Blocked Convex writes: Action:communityLive:refreshLiveStatus ×6, Mutation:sessions:ensureAppearanceMigrated ×1
Agent's saved appearance (preset/mode/chrome): cyberpunk/dark/expressive. Session result rewritten in 1/1 signed-in shots (1 differ from saved).
WARNING: 2 shot(s) had a Convex WebSocket (or a worker that could open one) outside the capture proxy, so its writes were not blocked: decks__desktop__default__dark, guest-gallery__desktop__default__dark. See `unproxied` in manifest.json.
--strict: failing because a Convex socket bypassed the capture proxy.
exit 1
```
