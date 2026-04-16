# Handoff: PERF-007 (active deck card lookups)

## Shipped

- **`ActiveDeckProvider`:** `canAddToSection` / `canMoveToSection` read the card from `useCardIndex()?.byId` instead of allocating a new `Map` over the full `cards` array on every catalog reference change.
- **`SiloedDeckProvider`:** Same pattern for deck-details add/move validation so behavior matches the sidebar and DnD mutation paths.

## Behavior notes

- When the catalog index is not ready (`index` null) or a card is not yet in the loaded slice, `byId` misses match the previous empty-map behavior: eligibility falls back through `canAddCardToDeck` / `getCardCopyLimit` as before for unknown cards.

## Verify manually

- Gallery → active deck: add, remove, move between main/side/reference; copy limits still enforced when the card is in the index.
- Deck details page: same operations from the details gallery and stacked views.

## Follow-ups (optional)

- Further wins would require a catalog hook that does not invalidate the whole `index` object on every chunked append (out of scope for this item).
