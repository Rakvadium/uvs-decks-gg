# Handoff: PERF-005 (Framer Motion / dense grids)

## Shipped

- **Card tiles:** `CardGridItemImageStage` and `DeckCardStackItem` use stacked faces + CSS `transition-opacity` for flip; drag preview ref attaches only to the visible face.
- **Card details:** V2 and legacy image panels use the same two-layer pattern; original dialog passes `backCard` into the panel.
- **Deck grid:** `DeckCardsStackedView` no longer wraps each cell in `motion.div` with index-based delay; optional `content-visibility-auto` on wrappers.
- **App shell:** `Providers` wraps content in `LazyMotion` (`domAnimation`, `strict`). UI components import `m` from `framer-motion/m`; `AnimatePresence` stays on `framer-motion` where needed.
- **Nav:** `layoutId` active pill removed (static border overlay) so `domAnimation` suffices without `domMax`.
- **Reduced motion:** Tier list pool panel, gallery sync progress bar, settings motion blocks, and deck sidebar hover preview skip or shorten transitions when `prefers-reduced-motion` is set.

## Verify manually

- Gallery grid: hover glow, flip (double-faced cards), drag ghost image.
- Deck details stacked view: hover, flip, open dialog.
- Tier list pool: presentation overlay enter/exit; pool body expand/collapse.
- Sidebar nav: active item styling; expand/collapse sidebars.

## Follow-ups (optional)

- If shared-element or layout animations return, consider `domMax` features instead of `domAnimation`.
- Bundle analyze: compare Framer chunk weight before/after on gallery route.
