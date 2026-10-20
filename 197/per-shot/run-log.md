# Console output: `per-shot`

```text
$ node --disable-warning=ExperimentalWarning scripts/pr-capture/capture.ts --issue "197" --label per-shot --port "8131" --strict --spec "C:/Users/xenos/AppData/Local/Temp/197/pershot.spec.json" --themes "default,cyberpunk" --modes dark --chrome expressive
Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset `default` (CSS still follows the pin; mode follows colorScheme emulation).
Reusing server on http://localhost:8131
Capturing #197 "per-shot" → C:\Projects\uvs-decks-gg\.claude\worktrees\agent-a7c2c12f972519251\.pr-captures\197\per-shot
  decks__desktop__default__dark.png
  decks__desktop__cyberpunk__dark.png
  guest-gallery__desktop__default__dark.png
  guest-gallery__desktop__cyberpunk__dark.png
Done: 4 stills. Blocked Convex writes: Action:communityLive:refreshLiveStatus ×10, Mutation:sessions:ensureAppearanceMigrated ×2
Agent's saved appearance (preset/mode/chrome): cyberpunk/dark/expressive. Session result rewritten in 2/2 signed-in shots (1 differ from saved).
```
