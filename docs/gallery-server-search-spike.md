# Gallery server-assisted search (spike)

## Purpose

The gallery today loads the full card catalog into the client (`listReleasedPaginated` + local `filterCards` / `sortCards`). That stays responsive for current catalog sizes (see PERF-001–003). This spike adds **Convex queries backed by indexes** so a future phase can move **text and narrow filters** to the server when the catalog grows enough that scanning every card in the browser is no longer acceptable.

## API

### `api.cards.galleryIndexedSearchSpike`

Public `query` (read-only, same visibility as other catalog queries). **Not wired into the gallery UI** in this spike; call it from a client experiment or admin tool.

**Args** (all optional except where noted; combine only as documented):


| Argument          | Role                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `namePrefixInSet` | `{ setCode, prefix }` — **lexicographic** name range within one set using the `by_setCode_and_name` index. Highest precedence when `prefix` is non-empty after trim.                            |
| `searchText`      | Full-text on `searchName` via `**search_gallery_name`** with optional `eq` filters. Used when no non-empty prefix branch runs.                                                                  |
| `setCode`         | With `searchText`: `eq("setCode", …)` in the search index. Without `searchText`: scan that set with `by_setCode_and_collectorNumber` (collector order), then apply `type` / `rarity` in memory. |
| `type`, `rarity`  | Single-value filters; applied in the search index when `searchText` is set, or in memory after the set index scan.                                                                              |
| `limit`           | Cap on returned rows (clamped 1–200, default 50).                                                                                                                                               |


**Returns:** `Doc<"cards">[]` shaped like other card list endpoints (`cardValidator`). Rows exclude backs-only faces and variant-only rows (`isFrontFace !== false` and `isVariant !== true`).

**Precedence:** `namePrefixInSet` (non-empty prefix) → `searchText` → `setCode`-only browse → empty array if nothing applies.

## Schema additions (backward compatible)

- **Index** `by_setCode_and_name` on `["setCode", "name"]` — supports set-scoped ordered access and prefix-style `gte` / `lt` on `name`.
- **Search index** `search_gallery_name` on `searchName` with filter fields `setCode`, `type`, `rarity`.

Existing documents do not require a data migration: Convex backfills new indexes on deploy. Ensure imports keep `searchName` populated (already used by `search_tier1_name` and other queries).

## What this proves

1. **Full-text + structured filters** can run in one indexed search (`search_gallery_name`) instead of `take(500)` + client filter.
2. **Set + name prefix** can use a **range** on a compound index rather than scanning all names client-side.
3. **Set-only** browsing can stay on `by_setCode_and_collectorNumber` with small in-memory refinement for type/rarity when only one set is selected.

## Migration path (client catalog → server-assisted)

Phased approach; no need to remove the local catalog immediately.

1. **Keep** progressive load + version sync for deck building and offline-feel browsing where needed.
2. **Introduce a feature flag** (or route variant): when the user types search text or applies a narrow filter (e.g. single set + type), call `galleryIndexedSearchSpike` (or a production rename) with the same semantics as today’s filter bar.
3. **Merge results** with the local index: resolve `_id` into the hydrated `CachedCard` when present; optionally fetch missing ids via `getByIds` for rows the client has not loaded yet.
4. **Pagination:** this spike uses `take`; a follow-up can add cursor pagination over the same indexes or a dedicated `paginationOpts` query.
5. **Multi-set and format legality:** today’s gallery allows multiple sets and format rules client-side. The spike’s search index supports **one** `setCode` equality; multi-set remains “widen search then filter in memory” or multiple queries until you add `setCode` array filters or a derived field.
6. **Sorting:** server returns index order; map gallery sort (set number, collector number, name) in a follow-up query or sort client-side on the smaller result set.

## Related code

- Implementation: `convex/cards.ts` (`galleryIndexedSearchSpike`, helper `isGalleryCatalogCard`).
- Schema: `convex/schema.ts` (`by_setCode_and_name`, `search_gallery_name`).
- Client catalog pipeline: `src/lib/universus/use-universus-cards.ts`, `GalleryFiltersProvider`.