# Console output: `full5`

```text
$ node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue "197" --label "full5" --port "8131" --strict --spec scripts/pr-capture/example.spec.json --themes "default,cyberpunk" --gif
Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset `default` (CSS still follows the pin; mode follows colorScheme emulation).
Reusing server on http://localhost:8131
Capturing #197 "full5" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-a7c2c12f972519251\.pr-captures\197\full5
  gallery__desktop__default__light.png
  gallery__desktop__default__dark.png
  gallery__desktop__cyberpunk__light.png
  gallery__desktop__cyberpunk__dark.png
  gallery__mobile__default__light.png
  gallery__mobile__default__dark.png
  gallery__mobile__cyberpunk__light.png
  gallery__mobile__cyberpunk__dark.png
  decks__desktop__default__light.png
  decks__desktop__default__dark.png
  decks__desktop__cyberpunk__light.png
  decks__desktop__cyberpunk__dark.png
  decks__mobile__default__light.png
  decks__mobile__default__dark.png
  decks__mobile__cyberpunk__light.png
  decks__mobile__cyberpunk__dark.png
  guest-gallery__desktop__default__light.png
  guest-gallery__desktop__default__dark.png
  guest-gallery__desktop__cyberpunk__light.png
  guest-gallery__desktop__cyberpunk__dark.png
  guest-gallery__mobile__default__light.png
  guest-gallery__mobile__default__dark.png
  guest-gallery__mobile__cyberpunk__light.png
  guest-gallery__mobile__cyberpunk__dark.png
  decks-new-deck-dialog__desktop__default__dark.gif (61 frames) + decks-new-deck-dialog__desktop__default__dark.webm
Done: 24 stills. Blocked Convex writes: Action:communityLive:refreshLiveStatus ×52, Mutation:sessions:ensureAppearanceMigrated ×17
Agent's saved appearance (preset/mode/chrome): cyberpunk/dark/expressive. Session result rewritten in 17/17 signed-in shots (17 differ from saved).
```
