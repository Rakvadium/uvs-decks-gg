# Sync chunk size — `fetchFromConvex` pagination limit

## Current value

`limit: 1000` (raw rows per `convex.query` call in `listReleasedPaginated`).

## Row count estimates

| Metric | Count |
| --- | --- |
| Total raw rows in `cards` table | ~5 000 |
| Gallery catalog cards (after `isGalleryCatalogCard` filter) | ~3 000–3 500 |
| Filter pass-through rate | ~65–70 % |

## How pagination works

`listReleasedPaginated` calls `ctx.db.query("cards").paginate({ numItems: limit })`,
which fetches `limit` raw rows from the database. The server then filters out
back-faces and variants before returning only gallery catalog cards to the client.

## Per-chunk size estimate

A typical card document serialises to roughly **1 KB** of JSON (30 fields including
short numerics, IDs, and several text-heavy search fields like `searchAll`).

| limit (raw rows) | Filtered cards/chunk | Approx. JSON size | Round-trips |
| --- | --- | --- | --- |
| 500 | ~325–350 | ~350 KB | ~10 |
| **1 000** | **~650–700** | **~700 KB** | **~5** |
| 2 000 | ~1 300–1 400 | ~1.4 MB | ~3 |

## Rationale for 1 000

- **5 round-trips** is low enough to avoid noticeable latency accumulation.
- **~700 KB** per chunk is comfortably under Convex's 8 MB query response limit
  and fast to parse in the browser (<10 ms on modern devices).
- Doubling to 2 000 would only save 2 round-trips but push chunks above 1 MB,
  increasing peak memory and parse cost with diminishing returns.
- Halving to 500 would nearly double round-trips for marginal payload savings.

## When to revisit

- If the card catalogue grows past ~8 000 raw rows, consider increasing to 1 500
  to keep round-trips ≤ 5.
- If per-card document size increases (e.g. adding large text fields), consider
  decreasing the limit to keep chunks under ~1 MB.
