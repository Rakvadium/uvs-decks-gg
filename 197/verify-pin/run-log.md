# Console output: `verify-pin` (independent verifier, PR #198)

```text
$ node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue "197" --label verify-pin --port "8221" --strict --spec ".pr-captures/v198.spec.json" --themes "cyberpunk,aurora" --modes "dark,light" --chrome expressive
Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset `default` (CSS still follows the pin; mode follows colorScheme emulation).
Reusing server on http://localhost:8221
Capturing #197 "verify-pin" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-ac08885044bcf4915\.pr-captures\197\verify-pin
  usermenu__desktop__cyberpunk__dark.png
  usermenu__desktop__cyberpunk__light.png
  usermenu__desktop__aurora__dark.png
  usermenu__desktop__aurora__light.png
  copy-link-toast__desktop__cyberpunk__dark.png
  copy-link-toast__desktop__cyberpunk__light.png
  copy-link-toast__desktop__aurora__dark.png
  copy-link-toast__desktop__aurora__light.png
  guest-gallery__desktop__cyberpunk__dark.png
  guest-gallery__desktop__cyberpunk__light.png
  guest-gallery__desktop__aurora__dark.png
  guest-gallery__desktop__aurora__light.png
Done: 12 stills. Blocked Convex writes: Action:communityLive:refreshLiveStatus ×26, Mutation:sessions:ensureAppearanceMigrated ×8
Agent's saved appearance (preset/mode/chrome): cyberpunk/dark/expressive. Session result rewritten in 8/8 signed-in shots (6 differ from saved).
exit=0
```
