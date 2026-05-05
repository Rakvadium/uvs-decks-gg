# REL-3 — Scoped catalog release per set (deferred)

## Current behavior

`releaseCards` in `convex/admin.ts` bumps a **single global** `cardDataVersion` row, refreshes gallery-eligible `cardCount` via `runCatalogAggregateRefresh`, and is what clients read through `api.cards.getCardDataVersion` / `api.admin.getCardDataVersion`.

## Why set-scoped release is non-trivial

- Player clients and IndexedDB caches key off **one integer version**, not per-set versions.
- Introducing per-set published versions implies either:
  - a **composite** client sync key (e.g. global version + per-set map), or
  - **multiple** release channels (CDN blobs, partial sync), with clear rules for deck legality and gallery filters.
- `listUnreleasedCards` already accepts optional `setCode` to **list** rows touched after the last global publish; it does **not** publish only that set.

## Suggested direction (when prioritized)

1. Decide whether “scoped release” means **visibility** (draft set until published), **CDN artifact** per set, or **changelog** for admins only.
2. If clients must sync independently per set, extend `getCardDataVersion` (or add a parallel query) with a stable schema version and document migration for existing IDB caches.
3. Keep global `cardDataVersion` as a monotonic “epoch” for backward compatibility until all readers support the new model.

## Stub

No `releaseCardsForSet` mutation is exposed; partial publication is not implemented. Use the global **Publish catalog** flow in admin until this note is superseded by a design in [SYSTEM_ANALYSIS.md](../../SYSTEM_ANALYSIS.md) or the backlog.
