# Handoff — DND-004 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **DND-004** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope

Today `useTcgDroppable` sets `activeDropZone` mainly via `mouseenter` / `mouseleave` (and pointer enter/leave). That misses fast moves and gaps between sibling zones.

During an **active drag** (`dragItem` non-null), resolve the hovered drop zone from **pointer coordinates**:

- On `pointermove` / `mousemove` / `touchmove` (global, while dragging), call `document.elementFromPoint` (using touch coordinates as needed).
- Walk up from that element to find a marked droppable root (e.g. `data-tcg-drop-zone="<id>"` on the element that receives `droppableProps`).
- If the element maps to a **registered** zone that accepts the current drag item and is not disabled, call `setActiveDropZone(id)`; otherwise clear to `null`.
- Keep touch support. The drag overlay is `pointer-events-none`; ensure hit testing still sees droppables beneath (overlay should not block — verify).
- You may keep enter/leave as a supplement or remove redundant paths if the global resolver is authoritative; behavior must be **stable** (no flicker): debounce sensibly only if needed, prefer consistent single source of truth.

Primary files: `src/lib/dnd/tcg-dnd-provider.tsx`, `src/lib/dnd/use-tcg-droppable.ts`. Do not implement DND-005+.

## Acceptance

- Fast pointer moves across adjacent drop targets still select the correct zone.
- Drops still invoke the right `onDrop`.
- `bun run build` passes.
- CHANGELOG + BACKLOG DND-004 Done.

## Report

Files changed, test notes, blockers.
