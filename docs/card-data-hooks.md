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

## Related backlog

- PERF-007 (done): active/siloed deck providers use `CardIndex.byId` for eligibility lookups.
