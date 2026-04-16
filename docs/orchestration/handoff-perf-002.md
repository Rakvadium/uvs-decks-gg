# Handoff — PERF-002 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **PERF-002**.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Files touched

- `src/lib/universus/use-universus-cards.ts` — single-pass `filterCards`; optional `FilterCardsFormatOptions.passesFormatLegality`; `sortCards` comparator factory, small-array fast paths, one-entry last-result cache; removed unused `StatOperator` import; typed Convex paginated query as `CachedCard[]`.
- `src/lib/universus/card-data-provider.tsx` — `getFilteredCards` passes format legality into `filterCards` instead of a second `.filter` pass.

## Verification

- `bun run build`: succeeded.
- `bun run lint`: fails repo-wide (e.g. `data/`); `eslint` on the two files above reports **0 errors** (pre-existing warnings: `react-hooks/exhaustive-deps` on `stableFormatsData` useMemo, unused `localVersion` in `use-universus-cards`).

## Behavior / semantics

- Filter predicates match the previous chained implementation (including search using `filters.search.toLowerCase()` after a trim-only truthiness gate, symbol/keyword branches, stat ranges, and stat filters).
- Format legality matches prior `getFilteredCards`: `!setCode || isSetLegalInFormat(setCode, formatKey)` when `filters.format` is set.
- Sort order and tie-breakers are unchanged; `field === "default"` still ignores `direction` as before.
- The sort cache keys on **array identity** plus `field`/`direction`. If a caller mutates a filtered array in place and calls `sortCards` again with the same reference, results could be stale; the app treats filtered lists as immutable outputs.
