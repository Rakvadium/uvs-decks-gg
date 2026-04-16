# Handoff — PERF-004 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **PERF-004**.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Files touched

- `src/components/gallery/main-content/content.tsx` — `detailsCard` state, shared `CardDetailsDialog`, `openCardDetails` wired to all three view modes.
- `src/components/gallery/main-content/grid-view.tsx`, `list-view.tsx`, `details-view.tsx` — pass `onOpenCardDetails` into row/tile components.
- `src/components/gallery/main-content/card-list-item/types.ts`, `hook.ts`, `content.tsx` — optional `onOpenCardDetails`; omit per-row dialog when set.
- `src/components/gallery/main-content/card-details-list-item.tsx` — optional `onOpenCardDetails`; omit embedded dialog when set.
- `src/components/universus/card-grid-item/types.ts`, `hook.ts`, `content.tsx` — optional `onOpenCardDetails`; skip embedded `CardDetailsDialog` when set; click/keyboard open uses host callback.
- `src/components/universus/card-details/dialog.tsx` — `React.lazy` for `CardDetailsV2`, `Suspense` + spinner fallback while `open`.

## Verification

- `bun run build`: succeeded.
- `bun run lint`: succeeded (repo script).

## Behavior / semantics

- Gallery grid, list, and details (virtualized) views no longer mount `CardDetailsDialog` per visible row/tile; one dialog instance lives in `GalleryMainContentBody` with `meta.filteredCards` and `getBackCard` for arrow navigation.
- Deck sidebar, tier lists, character picker, and other `CardGridItem` call sites without `onOpenCardDetails` keep the previous per-tile embedded dialog.
- Heavy dialog body loads on first open; repeat opens use the cached chunk.
