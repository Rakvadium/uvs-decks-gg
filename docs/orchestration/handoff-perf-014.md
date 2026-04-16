# Handoff: PERF-014 (gallery server search spike)

## Scope

Convex-only spike: indexed query `galleryIndexedSearchSpike` plus schema index `by_setCode_and_name` and search index `search_gallery_name`. Documents migration from full client-side catalog scan in `docs/gallery-server-search-spike.md`. Gallery UI unchanged.

## Touchpoints

- `convex/schema.ts` — new index + search index on `cards`.
- `convex/cards.ts` — `galleryIndexedSearchSpike`, `isGalleryCatalogCard` helper.
- `docs/gallery-server-search-spike.md` — API + migration notes.

## Verification

- `bunx convex codegen` (or deploy) after schema change.
- `bun run lint`
- `bun run build`

## Follow-ups

- Wire `useQuery(api.cards.galleryIndexedSearchSpike, …)` behind a flag from `GalleryFiltersProvider` with id hydration from the local catalog.
- Cursor pagination and gallery sort order on the server.
- Multi-set filter strategy (batch queries vs composite filter field).
