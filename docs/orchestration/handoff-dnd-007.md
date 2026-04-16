# Handoff — DND-007 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **DND-007** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope

First drag of a card can jank when the portal ghost `<img>` decodes a full card image cold.

Mitigate by one or more of:

- Extend `DragItem` in `src/lib/dnd/tcg-dnd-provider.tsx` with an optional field (e.g. `previewSrc` / `previewImageUrl`) populated from the source tile when starting a drag.
- In `useTcgDraggable` / callers, pass `currentSrc` or a small cached URL from an existing in-DOM `<img>` where available.
- In `DragOverlay`, prefer that URL for the ghost; optionally `await new Image().decode()` or use `HTMLImageElement.decode()` off the critical path (e.g. after paint) without blocking pointer updates.

Do not regress DND-001 rAF positioning. Scope changes to DnD layer + draggable hooks as needed; avoid refactors outside drag paths.

## Acceptance

- Noticeably less first-drag image hitch on typical gallery/deck tiles (best effort; document limitation if full fix impossible without `next/image` changes everywhere).
- `bun run build` passes.
- CHANGELOG + BACKLOG DND-007 Done.

## Report

Files changed, approach, verification.
