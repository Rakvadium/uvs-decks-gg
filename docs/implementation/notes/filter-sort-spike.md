# CAT-005 Spike — Main-thread budget for filter/sort

**Status:** Closed — not needed yet  
**Date:** 2026-04-16

## 1. Current implementation

### filterCards (use-universus-cards.ts, line ~286)

Single `for…of` loop over the full `CachedCard[]` array with early-`continue` on every filter predicate. Per-card work:

| Filter            | Hot operations per card                                           |
|-------------------|-------------------------------------------------------------------|
| search (name)     | 1–2 × `.toLowerCase()` + `.includes()` on short strings (~30 chars) |
| search (text/all) | 1–3 additional `.toLowerCase()` + `.includes()` on medium strings (~200 chars) |
| format legality   | `isSetLegalInFormat` — Map lookup + `parseSetLegality` (string split, cached array `.includes()`) |
| type / rarity / set | `Array.includes()` on tiny arrays (1–5 elements)               |
| symbols           | `.split("|")` + `.map(…)` + `.every()` or `.some()` — up to ~4 elements |
| keywords          | `cardHasKeyword` → `.split("|").map().some()` — up to ~6 elements |
| stat ranges       | Numeric comparisons — negligible                                  |
| zones             | `.toLowerCase()` + `Array.includes()` — negligible               |

Key observations:

- **Early exit on first failing predicate** — average cards test 2–3 cheap checks before exiting. Only cards matching everything reach the push.
- `.toLowerCase()` is the most called function. Strings are short (card names avg ~25 chars, card text avg ~150 chars, `searchAll` avg ~250 chars).
- `.split("|")` for symbols/keywords creates small temporary arrays (≤ 6 elements).
- No DOM access, no allocations beyond the output array and tiny temporaries.

### sortCards (use-universus-cards.ts, line ~487)

- Creates a shallow copy via `[...cards]`.
- Calls `.sort()` with a single comparator function.
- Default sort: two numeric comparisons (setNumber, collectorNumber with parseInt).
- Named sort (name/type/rarity/set): `.localeCompare()` per pair.
- Numeric sorts: subtraction — negligible.

TimSort (V8's `.sort()`) on n = 3500 performs ~42k comparisons in the worst case (n × log₂n ≈ 3500 × 12). `.localeCompare()` is the heaviest comparator at ~0.5 μs per call → ~21 ms worst case for a full name sort. Numeric sorts are under 1 ms.

### Memoization & scheduling in GalleryFiltersProvider

The pipeline runs inside a `useMemo` that depends on `pipelineFilters` and `deferredSortOptions`:

```
const filteredCards = useMemo(() => {
  const filtered = getFilteredCards(pipelineFilters);
  return sortCards(filtered, deferredSortOptions);
}, [getFilteredCards, pipelineFilters, deferredSortOptions]);
```

Additional protections already in place:

- **`useDeferredValue`** wraps `search`, `searchMode`, `galleryFilters`, and `sortOptions` — React defers the recomputation to an interruptible low-priority render, preventing input stutter.
- **`startTransition`** wraps `updateFilter`, `clearAllFilters`, and `removeFilterKeys` — filter changes are non-urgent transitions.
- **`useMemo`** ensures recomputation only on actual dependency changes, not on every render.

## 2. Cost estimate for 3 500 cards

| Operation | Estimated wall time (M2 MacBook, Chrome V8) | Notes |
|-----------|----------------------------------------------|-------|
| `filterCards` — no search, 1–2 facet filters | < 0.5 ms | Mostly numeric/includes checks; early exit |
| `filterCards` — name search | 1–2 ms | `.toLowerCase().includes()` on ~25-char strings × 3500 |
| `filterCards` — full-text "all" search | 2–4 ms | `.toLowerCase().includes()` on ~250-char `searchAll` × 3500 |
| `filterCards` — all filters active | 3–5 ms | Worst case: all predicates evaluated |
| `sortCards` — numeric (default) | < 0.5 ms | Subtraction comparator |
| `sortCards` — `.localeCompare()` (name) | 8–15 ms | ~42k comparisons × ~0.3–0.5 μs |
| Combined worst case | 10–20 ms | Full-text search + name sort |

The 16 ms frame budget is only at risk when combining full-text search with `.localeCompare()` name sorting. However:

1. `useDeferredValue` makes search recomputation interruptible — React can yield mid-render.
2. The combined operation only fires when both search text and sort field change simultaneously, which is rare in practice.
3. Low-end mobile devices (2–4× slower) would see ~40–80 ms, but `useDeferredValue` still prevents input jank.

## 3. Web Worker assessment

| Factor | Impact |
|--------|--------|
| **Structured clone of 3 500 CachedCard objects** | Each card has ~30 fields (strings, numbers, optionals). Estimated `postMessage` serialization: **8–15 ms** each direction. Round-trip overhead: **16–30 ms** — potentially more expensive than the computation itself. |
| **Async result handling** | Worker results arrive asynchronously. The current synchronous `useMemo` pipeline would need refactoring to `useEffect` + state, adding complexity and a render-flicker risk. |
| **Code duplication** | `filterCards` and `sortCards` would need to be importable in a Worker context. Worker bundling adds build complexity. |
| **Transferable optimization** | Not applicable — card data is plain objects, not ArrayBuffers. |

**Verdict: Web Worker adds latency (serialization) and complexity without a net performance gain at current catalog sizes.**

## 4. Client search index assessment (Fuse.js / MiniSearch)

| Factor | Impact |
|--------|--------|
| **Bundle size** | Fuse.js: ~25 kB min+gz. MiniSearch: ~8 kB min+gz. |
| **Index build time** | 50–150 ms for 3 500 documents on load — delays initial display. |
| **Index rebuild on data change** | Must rebuild when card cache updates (version sync). |
| **Search quality** | Fuzzy matching and relevance scoring — better UX for typo-tolerant search. |
| **Current search quality** | `.includes()` substring match is deterministic and matches user expectations for an exact card name lookup. |
| **Filter integration** | Search indexes handle text search only. Facet filters (type, rarity, stat ranges, zones) would still run as array iteration, meaning both systems run in parallel. |

**Verdict: Not needed for performance. Could be a UX enhancement (fuzzy search) but that's a separate feature, not a perf fix.**

## 5. Scaling projection

| Catalog size | filterCards (worst) | sortCards (name) | Combined | Risk |
|--------------|---------------------|------------------|----------|------|
| 3 500 (current) | 3–5 ms | 8–15 ms | 10–20 ms | Low — within `useDeferredValue` budget |
| 5 000 | 5–7 ms | 12–20 ms | 17–27 ms | Low — `useDeferredValue` handles it |
| 10 000 | 10–15 ms | 25–40 ms | 35–55 ms | Medium — mobile devices may feel sluggish |
| 20 000 | 20–30 ms | 50–80 ms | 70–110 ms | High — would warrant optimization |

The game currently has ~3 500 cards. TCGs typically add 200–400 cards per set, with 2–4 sets per year. Reaching 10 000 cards would take roughly 8–16 years at current pace.

## 6. Recommendation

**Not needed yet.**

The existing `useDeferredValue` + `startTransition` + `useMemo` pipeline already prevents main-thread jank for the current catalog size and foreseeable growth. The serialization cost of a Web Worker would negate any computation savings, and a client search index adds bundle weight without solving a real performance problem.

### If revisiting in the future (> 10 000 cards)

1. **Pre-lowercased search fields** — Store `nameLower`, `textLower` on the `CachedCard` at cache-build time to eliminate per-filter `.toLowerCase()` calls. Zero bundle cost, ~30% speedup on search-heavy paths.
2. **Incremental sort with cache key** — If the same sort field is applied to a slightly modified filtered set, maintain a sorted-order cache and use insertion-sort for small deltas.
3. **Web Worker only if** serialization can be avoided (e.g., SharedArrayBuffer with a binary card index).
4. **Client search index only if** fuzzy/typo-tolerant search becomes a product requirement.

### No follow-up backlog rows needed.
