# Handoff: PERF-015 (stable infinite scroll observer)

## Scope

`useInfiniteSlice` no longer lists `loadMore` in the `IntersectionObserver` effect dependency array. The latest `loadMore` is held in a ref updated each render; the observer callback invokes `loadMoreCallbackRef.current()`. Effect deps are only `rootMargin` (and would include `root` / `threshold` if those options are added later).

## Touchpoints

- `src/hooks/useInfiniteSlice.ts` — ref + effect deps.

## Verification

- `bun run lint`
- `bun run build`
- Manual: deck character picker infinite scroll; any future caller passing `rootMargin` from `useIsMobile()` should see observer recreate only when the margin string changes (PERF-009 `matchMedia` sync), not on unrelated `loadMore` identity changes.

## Note

Deck-details sidebar gallery (`useGallerySidebarModel`) does not use `useInfiniteSlice`; only `character-picker-dialog` and shared `LoadMoreIndicator` patterns do today.

## Follow-ups

- Optional: add `root` / `threshold` to the hook options with the same “stable effect, ref for callbacks” rule if non-default roots are needed.
