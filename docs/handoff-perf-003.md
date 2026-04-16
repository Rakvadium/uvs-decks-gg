# Handoff — PERF-003 (gallery virtualization)

## Shipped

- Dependency: `@tanstack/react-virtual`.
- `GalleryMainScrollRootProvider` + `useGalleryMainScrollRootRef()` attach the main gallery `overflow-y-auto` element so the virtualizer’s `getScrollElement` matches the real scroll container (not `window`).
- **Grid:** Row virtualizer; each row is a CSS grid row with `columnCount` derived from the same rules as before (mobile 1–2 cols, desktop `cardsPerRow`). `gap: 16` matches `gap-4`. `measureElement` on each row; `getItemKey` uses the first card id in the row.
- **List / details:** Single-column virtualizers with `measureElement`, list `gap: 12` (`space-y-3`), details `gap: 24` (`space-y-6`).
- Removed `useInfiniteSlice` and `LoadMoreIndicator` from these three views; the old pattern only capped mounted nodes. Convex/card-data loading still surfaces via existing `LoadingProgress`.

## Follow-ups (not in scope)

- Deck-details sidebar gallery (`deck-details-sidebar-gallery/body.tsx`) still uses a sliced list + “Load more” button; virtualize there if that panel needs the same DOM bounds.
- `useInfiniteSlice` remains for `character-picker-dialog` and sidebar gallery hook.
