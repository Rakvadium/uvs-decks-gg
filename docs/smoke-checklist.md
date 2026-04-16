# Smoke checklist — tcg-decks

Minimal verification before merge or release when CI does not run these automatically. Adjust routes if product URLs change.

## Commands (local)

From repository root, with dependencies installed:

1. `bun run build` — must exit 0.
2. `bun run lint` — should exit 0; treat new errors in touched files as blocking.

## Critical flows (manual)

Signed-out:

- Landing `/` loads.
- Gallery `/gallery` loads and search/filter UI responds.

Signed-in:

- Home `/home` loads.
- Decks `/decks` list loads; open a deck `/decks/[deckId]` if data exists.
- Settings `/settings` loads; theme/color controls persist after refresh.
- Community `/community` and tier list detail `/community/tier-lists/[id]` load when fixtures exist.

## Notes

Repository lint currently may report pre-existing issues; goal is zero new violations in changed files and a clean build. Add or wire CI when the team wants these steps enforced on every push.

For card drag-and-drop verification (gallery, deck sidebar, deck details, tier list lanes), use [dnd-regression-checklist.md](./dnd-regression-checklist.md).
