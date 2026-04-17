# Card data hooks — subscription scope

The catalog (released cards in IndexedDB + in-memory list) loads in chunks while syncing from Convex. Each append produces a new `cards` array reference. **Metadata** (formats, sets, format/set lookups) updates on its own schedule and should not force re-renders for UI that only needs those maps.

`CardDataProvider` exposes two React contexts:

| Hook | Subscribes to | Updates when |
| --- | --- | --- |
| `useCardReferenceData()` | Formats, sets, `getSetByCode`, `getFormatByKey`, `isSetLegalInFormat` (set-legality string path used with filters) | Sets/formats load or sync |
| `useCardCatalog()` | `cards`, `index`, `uniqueValues`, load/sync progress, `refreshCache`, `getFilteredCards`, sorting/pagination helpers | Catalog list, index, or derived filter closures change |

| Hook | Subscribes to | When to use |
| --- | --- | --- |
| `useCardData()` | **Both** contexts (merged object) | Legacy / convenience; prefer narrow hooks in new code or hot subtrees |
| `useCardIndex()` | Catalog only (`index`) | Lookups by id / name / set buckets; active and siloed deck eligibility use `byId` only (no second full map; PERF-007). |
| `useFilteredCards` / `useFilteredAndSortedCards` | Catalog only (`cards`) | Filter helpers without touching reference context |

## Feature guidance

- **Gallery filters / grid / list / details:** Needs catalog + formats → `useCardCatalog` + `useCardReferenceData` (or `useCardData` if a single merge is simpler and perf is acceptable).
- **Deck / active deck / deck details:** Typically need `cards` or `getFilteredCards` → `useCardCatalog` (or `useCardData`).
- **Tier list builder (sets + cards):** `useCardCatalog` for `cards`, `useCardReferenceData` for `sets` so set metadata does not depend on catalog context identity.
- **Community rankings / feed / pool dialogs:** Usually need `cards` → `useCardCatalog`.
- **UI that only shows format or set pickers:** `useCardReferenceData` only; wrap in `React.memo` when embedded under parents that subscribe to the catalog.

## CAT-008 — `filteredCards` memory tradeoff (gallery + dialog navigation)

### Data flow

```
CardDataProvider (cards[])                       ← single source of truth
  └─ GalleryFiltersProvider                      ← useMemo: filterCards() → sortCards()
       ├─ meta.filteredCards  (CachedCard[])      ← new array (filter+sort produce shallow copies)
       └─ GalleryMainContentBody
            ├─ useInfiniteSlice(filteredCards)    ← renders sliced window (72-card pages)
            └─ <CardDetailsDialog cards={meta.filteredCards} />
                 └─ index navigation via currentIndex into the same array ref
```

### What is held in memory

| Layer | What | Allocation | Notes |
| --- | --- | --- | --- |
| `CardDataProvider` | `cards[]` — full catalog (~3 500 objects) | **One array**, objects created during sync | Baseline cost; always present while app is mounted. |
| `GalleryFiltersProvider` | `filteredCards` — `useMemo` result of `filterCards` + `sortCards` | **New shallow array** per filter/sort change. Objects inside are the **same references** as `cards[]`. | `sortCards` does `[...cards].sort(…)` — allocates a new array shell but does not clone card objects. |
| `CardDetailsDialog` | Receives `cards` prop = `meta.filteredCards` | **No additional allocation.** React passes the reference; the dialog reads `cards[currentIndex]`. | No clone, no slice, no spread. Navigation is a single `setCurrentIndex` state update. |
| `CardNavigationContext` | Stores `{ cards, getBackCard }` in context value | Same reference again — context value object is tiny (two fields). | Only used in the preview dialog, not in main gallery dialog path. |

### Peak memory estimate

| Metric | Value |
| --- | --- |
| Catalog size (current) | ~3 500 cards |
| Estimated per-card shallow size | ~0.5–1 KB (string fields: name, text, keywords, imageUrl, searchName, searchText, searchAll; numeric fields; two Convex IDs) |
| Full catalog array | ~1.75–3.5 MB |
| Worst-case `filteredCards` (no filters applied) | One extra `Array` header (~56 bytes for 3 500 slots on V8) pointing to the **same** card objects — **no object duplication** |
| Dialog navigation overhead | **0 bytes** beyond the existing `filteredCards` reference |
| `useInfiniteSlice` visible window | 72-card slice for rendering; the source `filteredCards` is referenced, not copied |

**Total overhead of the gallery filter + dialog navigation pipeline: one shallow array copy (~28 KB of pointer slots for 3 500 items). Card object memory is shared.**

### Mobile budget check

| Device class | Typical JS heap | Catalog % of heap |
| --- | --- | --- |
| Desktop (Chrome) | 2–4 GB | < 0.1% |
| Mid-range mobile (512 MB heap) | ~512 MB | ~0.7% |
| Low-end mobile (256 MB heap) | ~256 MB | ~1.4% |

Even on a low-end device the full unfiltered catalog is well within budget. The shallow array copy for `filteredCards` adds negligible overhead on top.

### Is lazy navigation needed now?

**Verdict: No.** At ~3 500 cards:

1. The dialog receives the `filteredCards` array **by reference** — zero additional memory.
2. `sortCards` creates a shallow copy (`[...cards].sort(…)`) — ~28 KB of pointers, not cloned objects.
3. Navigation is index-based (`currentIndex` state) — no windowing or prefetch is required.
4. `useInfiniteSlice` already virtualizes the rendered grid/list; the dialog has no DOM cost until opened.

### When would lazy navigation matter?

| Threshold | Concern | Mitigation |
| --- | --- | --- |
| **10k+ cards** (3× current) | `sortCards` shallow copy grows to ~80 KB; `filterCards` iteration takes ~2–5 ms. Still negligible. | None needed. |
| **50k+ cards** | Sort + filter on every keystroke could cause jank (>16 ms). Shallow array ~400 KB. | Move filter/sort to a Web Worker, or debounce search more aggressively. |
| **100k+ cards** | Array iteration alone risks >50 ms; pointer array ~800 KB. Multiple re-renders during typing compound the cost. | Replace full-array navigation with **sorted ID list + `index.byId`** lookups. Cap dialog nearby slice to ±50 IDs. Consider virtualized search with server-side filtering. |

At current and foreseeable catalog sizes (game has ~4 000 released cards across all sets), none of these thresholds apply.

### Recommendations

- **No code changes required.** The current architecture is sound for the catalog size.
- If the catalog ever exceeds ~10k cards (unlikely for this game), revisit by:
  1. Passing `filteredCardIds: string[]` + `cardIndex.byId` to the dialog instead of the full object array.
  2. Capping dialog prefetch to ±50 neighbors around `currentIndex`.
- Mark CAT-008 as **done** with verdict "not needed yet; documented threshold."

## Related backlog

- PERF-007 (done): active/siloed deck providers use `CardIndex.byId` for eligibility lookups.
- CAT-008 (done): `filteredCards` memory tradeoff documented; lazy navigation not needed at current scale.
