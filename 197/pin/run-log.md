# Console output: `pin`

```text
$ node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue "197" --label pin --port "8131" --spec "C:/Users/xenos/AppData/Local/Temp/197/pin.spec.json" --themes aurora --modes light
Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset `default` (CSS still follows the pin; mode follows colorScheme emulation).
Reusing server on http://localhost:8131
Capturing #197 "pin" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-a7c2c12f972519251\.pr-captures\197\pin
  pin-usermenu__desktop__aurora__light.png
  copy-link-toast__desktop__aurora__light.png
  guest-gallery__desktop__aurora__light.png
Done: 3 stills. Blocked Convex writes: Mutation:sessions:ensureAppearanceMigrated ×2, Action:communityLive:refreshLiveStatus ×6
Agent's saved appearance (preset/mode/chrome): cyberpunk/dark/expressive. Session result rewritten in 2/2 signed-in shots (2 differ from saved).
```
