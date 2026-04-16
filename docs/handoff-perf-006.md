# Handoff: PERF-006 — narrow card data subscriptions

## Shipped

- `CardReferenceContext` + `useCardReferenceData()` for formats, sets, and stable lookups (`getSetByCode`, `getFormatByKey`, `isSetLegalInFormat` aligned with gallery filter legality).
- `CardCatalogContext` + `useCardCatalog()` for `useUniversusCards` fields, `getFilteredCards` / sort / paginate helpers, and catalog-tied state.
- `useCardIndex()` reads `index` from the catalog context only.
- `useCardData()` = merge of both contexts for backward compatibility (subscribes to both).
- `useFilteredCards` / `useFilteredAndSortedCards` use `useCardCatalog` only.

## Follow-ups

- Migrate high-traffic call sites from `useCardData` to narrow hooks where only one slice is needed; combine with `React.memo` for format/set-only subtrees under catalog-heavy parents.
- PERF-007: active deck card map should use `useCardIndex()` / `byId` instead of rebuilding full maps from `cards` on every catalog tick.

## Verification

- `bun run lint`
- `bun run build`
