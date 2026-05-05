# CAT-007 — Manual verification checklist

After deploying schema and functions that add **`cardFacetSnapshot`** and **bounded `cards` reads**, run through the following in staging or local Convex.

## Prerequisites

- `bunx convex codegen` and `bun run build` succeed.
- Rarities, types, and set codes in filters come from the **`cardFacetSnapshot`** row (key `default`), refreshed by **`rebuildCardFacetSnapshot`** (internal). Until the first successful refresh, facet queries return **empty arrays**; use **Release All Unreleased** or a card import to populate.

## Admin — `/admin/cards`

1. Open the page with an **empty** search box. Confirm the table loads (up to **100** gallery catalog rows) without long hangs.
2. Type a few characters in search. Confirm search results still load.
3. Use **Release All Unreleased** once. Confirm the button completes and the app still behaves; this path runs a facet/count rebuild.

## Facets (if the UI still calls `getRarities` / `getTypes` / `getSets` anywhere you care about)

4. After a data refresh, open or exercise any screen that lists rarity/type/set filters. Confirm lists match expectations (non-empty when the DB has cards).

## Data refresh paths (Convex)

5. **Import** cards (JSON import or `importUniversusCards` / `importCardsOnly` as applicable), then re-check step 4 (facets) and step 1 (admin list).

6. If you use **clear all cards**, confirm facets and admin list reflect an empty or updated catalog.

## Optional (developers)

7. Grep for `ctx.db.query("cards").collect()` in `convex/`; remaining uses should be **cold paths** (e.g. avoid hot subscriptions on unbounded reads).
