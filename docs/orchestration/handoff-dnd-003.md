# Handoff — DND-003 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **DND-003** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope

`useTcgDraggable` in `src/lib/dnd/use-tcg-draggable.ts` currently calls `useTcgDnd()` and receives the full context value. When `activeDropZone` updates during a drag, every draggable subscriber re-renders unnecessarily.

Split or narrow the DnD React context so **draggable hooks only subscribe to stable drag actions** (`startDrag`, `endDrag`) and **not** to `activeDropZone` / drop-highlight state. Droppables, `DragOverlay`, and any UI that needs `activeDropZone` or `dragItem` can use a separate context or `useSyncExternalStore` pattern.

Touch `src/lib/dnd/tcg-dnd-provider.tsx`, `use-tcg-draggable.ts`, `use-tcg-droppable.ts`, and `src/lib/dnd/index.ts` only as needed. Preserve public exports and behavior.

Do not implement DND-004+ in this change set.

## Acceptance

- Moving the pointer across drop zones during drag does not force re-renders of unrelated draggable card tiles (architecturally: `useTcgDraggable` must not depend on `activeDropZone` in its subscription path).
- Drops and drag start/end still work everywhere.
- `bun run build` passes; do not add new lint errors in edited files.
- CHANGELOG + BACKLOG for DND-003.

## Report

Approach summary (which contexts), files changed, verification.
