# worker-service

```text
Reusing server on http://localhost:8132
Capturing #211 "worker-service" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-a516ae22cfec2db0f\.pr-captures\211\worker-service
  decks__desktop__default__dark.png
  guest-gallery__desktop__default__dark.png
Done: 2 stills. Blocked Convex writes: Mutation:sessions:ensureAppearanceMigrated ×1, Action:communityLive:refreshLiveStatus ×4
Agent's saved appearance (preset/mode/chrome): cyberpunk/dark/expressive. Session result rewritten in 1/1 signed-in shots (1 differ from saved).
    WARNING: Convex socket outside the capture proxy: during sign-in: a service worker started (http://localhost:8132/__probe/sw.js); WebSockets it opens bypass the capture proxy and can't be seen, so its writes would not be blocked; a service worker started (http://localhost:8132/__probe/sw.js); WebSockets it opens bypass the capture proxy and can't be seen, so its writes would not be blocked
    WARNING: Convex socket outside the capture proxy: a service worker started (http://localhost:8132/__probe/sw.js); WebSockets it opens bypass the capture proxy and can't be seen, so its writes would not be blocked
WARNING: 2 shot(s) had a Convex WebSocket (or a worker that could open one) outside the capture proxy, so its writes were not blocked: decks__desktop__default__dark, guest-gallery__desktop__default__dark. See `unproxied` in manifest.json.
--strict: failing because a Convex socket bypassed the capture proxy.
exit=1
```
