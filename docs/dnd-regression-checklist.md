# Card drag-and-drop — manual regression checklist

Run this before closing the DND epic or after changes under `src/lib/dnd/`. Mark each item when verified.

## Gallery → active deck

- [ ] From the gallery grid, drag a card into the **main** section of the active deck sidebar; count and list update as expected.
- [ ] Drag a card into the **side** section of the active deck sidebar.
- [ ] If the UI exposes a **reference** section, drop there and confirm behavior matches rules (legality, counts, or empty state as designed).

## Active deck sidebar — reorder

- [ ] Reorder cards **within** the main section (drop between siblings); order persists or matches product rules after navigation/refresh if applicable.
- [ ] Reorder within the side section the same way.

## Deck details page

- [ ] Open a deck’s detail view; drop a card into the **active section** strip or drop target; the card lands in the correct section without duplicate or ghost state.

## Community tier list builder

- [ ] Drag a card **between lanes** (e.g. tier to tier); placement matches the lane under the pointer.
- [ ] With **fast pointer moves** across lane boundaries, the highlighted target stays coherent (no stuck hover on the wrong lane, no drop on the wrong tier).

## Optional: debug logging

To trace DnD in the browser (implementation: `src/lib/dnd/tcg-dnd-provider.tsx`):

- Append `?dndDebug=1` to the URL, **or**
- Set `localStorage` key `tcg:dndDebug` to `1` and reload.

Remove or clear when finished so console noise stays low.

## Related docs

- [Smoke checklist](./smoke-checklist.md) — build, lint, and critical routes.
- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) — app structure and data flows.
