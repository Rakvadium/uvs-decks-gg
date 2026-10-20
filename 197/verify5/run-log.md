$ node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue "197" --label "verify5" --port "8261" --spec scripts/pr-capture/example.spec.json --strict --gif --themes "default,cyberpunk" --modes "light,dark" --viewports "desktop,mobile"
Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset `default` (CSS still follows the pin; mode follows colorScheme emulation).
Reusing server on http://localhost:8261
Capturing #197 "verify5" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-a803a271b490d114c\.pr-captures\197\verify5
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
  decks-new-deck-dialog__desktop__default__dark.gif (63 frames) + decks-new-deck-dialog__desktop__default__dark.webm
Done: 24 stills. Blocked Convex writes: Action:communityLive:refreshLiveStatus ×52, Mutation:sessions:ensureAppearanceMigrated ×17
Agent's saved appearance (preset/mode/chrome): cyberpunk/dark/expressive. Session result rewritten in 17/17 signed-in shots (17 differ from saved).
