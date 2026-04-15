# UI and UX design — tcg-decks

## Principles

- **Progressive disclosure** — Deck and collection tools should surface the next action clearly without crowding primary canvases.
- **Consistent shell** — App chrome, mobile sheets, and sidebars should behave predictably across routes (`src/components/shell/`).
- **Accessible controls** — Prefer Radix-backed primitives; preserve focus order and semantics in custom widgets.
- **Performance** — Large lists (cards, deck rows) should use windowing or pagination patterns where needed; avoid unnecessary client subscriptions.

## Implementation alignment

- **Composition:** Follow [component-architecture-playbook.md](./component-architecture-playbook.md) so dialogs, panels, and pages stay small and testable.
- **Theming:** Session-backed theme and palette preferences should remain coherent with `next-themes` and existing color scheme tokens.

## Related

- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [community-tier-list-system.md](./community-tier-list-system.md) for community-specific UX rules
