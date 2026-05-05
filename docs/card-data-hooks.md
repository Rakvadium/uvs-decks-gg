# Card data hooks — subscription scope

The catalog syncs gallery-facing rows into IndexedDB (`isFrontFace !== false`, `isVariant !== true`), then merges dual-face **back** documents in memory via `batchGetCardsByIds` so `getBackCard` / `CardIndex.byId` still resolve `backCardId`. IndexedDB metadata includes `schemaVersion`; a mismatch clears the cache (same effect as calling `clearCardCache()` from `card-store`). Each sync produces a new `cards` array reference. **Metadata** (formats, sets, format/set lookups) updates on its own schedule and should not force re-renders for UI that only needs those maps.

**Catalog sync chunking (CAT-002):** `fetchFromConvex` in `use-universus-cards` calls `cards.listReleasedPaginated` with page size `GALLERY_CATALOG_SYNC_PAGE_SIZE` = **1000** (Convex `paginate` `numItems`, same default on the server when `limit` is omitted). That cuts round-trips versus smaller pages (e.g. 500) while keeping each response within typical Convex read limits: a full `cardValidator` document is on the order of **~0.5–2 kB** JSON per row depending on `text` / `searchAll` length, so **~1000 rows** is roughly **~0.5–2 MiB** of serialized payload per page—well under the practical ~16 MiB per-query cap. The loop is still one `convex.query` per raw page until `isDone` (the returned `cards` array can be smaller than 1000 after the gallery filter inside the handler).

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

## Gallery: `filteredCards`, context, and `CardDetailsDialog` (CAT-008)

**What is stored where**

- `GalleryFiltersProvider` derives **`meta.filteredCards`** once per deferred filter + sort snapshot (`useMemo` over `getFilteredCards` → `sortCards` in `src/providers/GalleryFiltersProvider.tsx`). That value is a **single** array: an ordered list of **references** to `CachedCard` objects that already live in the in-memory catalog (`useCardCatalog().cards` / the same objects `filterCards` kept from the main list). It is **not** a second deep copy of every card’s fields.
- The gallery’s shared **`CardDetailsDialog`** is wired with **`cards={meta.filteredCards}`** (`src/components/gallery/main-content/content.tsx`). The dialog prop is the **same array reference** as `meta.filteredCards`, not a `slice` or spread that allocates another large array. React holding that prop does not, by itself, duplicate the filtered list in heap terms beyond one array object plus one pointer per match.

**Peak memory and mental model**

- **Dominant cost** for a large match set is: **(1)** the live catalog’s objects (bounded by what was synced) **+ (2)** one **filtered+sorted** array of length **n** (pointers to those objects). Sub-megabyte concerns at ~10k entries are **dominated by the `CachedCard` graph already loaded for the app**, not by an extra full clone of 10k cards for the dialog.
- **Context fan-out:** any subtree that calls `useGalleryFilters()` receives the same `meta` object when the provider’s memoized `value` updates; the **`filteredCards` reference** is part of that snapshot. This is a **read subscription** cost and re-render scope question, not an automatic second 10k-array allocation.
- **Other gallery routes** (e.g. `CardListVirtualizer` / `items: meta.filteredCards`) need the same ordered list for virtualization and counts; a dialog-only “ids only” handoff would not remove the need for a full ordered list **unless** the main views were also redesigned around ids + `index.byId` resolution.

**Lazy navigation (deferred)**

- A **slimmer** dialog API (e.g. **sorted `cardId` list** + `CardIndex.byId` lookups for prev/next, or a **capped “nearby” window** of ids around the current card) could shrink what the dialog **closure** holds if measurements ever show a problem. That only pays off if profiling shows **extra** retained memory or **structural** sharing issues beyond the single `filteredCards` array.
- **Verdict (this pass):** no code change. **Rationale:** one shared `filteredCards` reference is already the minimal extra structure for in-dialog prev/next; pathological 10k+ result sets are **not** addressed by duplicating a second array in the dialog today. Revisit if **Heap snapshots** (after filtering to a very large **n**) show unexpected growth or if product requirements add **unbounded** in-memory result sets (e.g. without virtualization caps).

**Related code:** `src/providers/GalleryFiltersProvider.tsx` (`filteredCards`, `meta`), `src/components/universus/card-details/dialog.tsx` (`cards`, `getBackCard`, index sync), `src/components/gallery/main-content/content.tsx` (host dialog).

## Related backlog

- CAT-008 (done): peak memory and sharing model for `meta.filteredCards` + gallery `CardDetailsDialog`; lazy navigation left as follow-up if profiling requires it.
- PERF-007 (done): active/siloed deck providers use `CardIndex.byId` for eligibility lookups.
