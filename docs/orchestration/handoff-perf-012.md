# Handoff: PERF-012 (Direct imports, universus barrels)

## Shipped

- Removed **barrel** usage of `@/lib/universus` and `@/components/universus` across card-heavy surfaces: imports now target `card-data-provider`, `use-universus-cards`, `card-store`, `card-details/dialog`, `card-details/content`, and `card-grid-item` as appropriate.
- **Types:** `CachedCard` from `@/lib/universus/card-store` where only the type is needed.

## Verify

- `bun run build` (passes).
- Spot-check gallery grid/list, deck details card stacks, character picker, tier list lanes (card tiles).

## Follow-ups

- Barrel index files remain for convenience in low-traffic or future code; prefer direct paths in new hot-path code.
- `bun run lint` still reports many pre-existing issues in the repo; not introduced by this change.
