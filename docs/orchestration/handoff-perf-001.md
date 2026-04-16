# Handoff — PERF-001 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **PERF-001**.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Files touched

- `src/providers/GalleryFiltersProvider.tsx` — deferred inputs for `getFilteredCards` / `sortCards`; `startTransition` around `setGalleryFilters` mutations; `meta.filteredListKey`.
- `src/components/gallery/main-content/content.tsx` — React keys for gallery views use `meta.filteredListKey`.
- `src/components/deck-details/deck-details-sidebar-gallery/hook.ts` — sidebar visibility key uses `meta.filteredListKey` + `viewMode`.

## Verification

- `bun run build`: succeeded (Next.js production compile completed).
- `bun run lint`: **exit code 1** in this repo (many pre-existing issues across `convex/`, `data/`, etc.). No new findings reported for the files above.

## Criteria

- Search field remains controlled by immediate `state.search` / `setSearch` (top bar unchanged); list uses deferred filter/sort inputs.
- Filter dialog and chips still read immediate `state.filters` / actions; heavy work follows deferred pipeline.
