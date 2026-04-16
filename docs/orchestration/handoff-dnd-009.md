# Handoff — DND-009 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **DND-009** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope

`src/components/shell/mobile-actions-sheet/draggable-drawer.tsx`: `updateDrag` calls `setDrawerHeight` on every `pointermove`, which can churn React renders during resize.

Coalesce updates: e.g. store pending height in a ref, apply **`requestAnimationFrame`** (one commit per frame), and/or update **`style.height`** imperatively on a ref’d node during the drag while keeping React state reconciled at **pointerup** / cancel / settle paths.

Preserve behavior: clamp rules, close threshold, `HANDLE_OVERLAP`, open/close sheet, tap shield, `expandedHeight` / `minHeight` logic.

## Acceptance

- Resizing the mobile actions drawer on pointer drag remains smooth; fewer intermediate React commits during move.
- `bun run build` passes.
- CHANGELOG + BACKLOG DND-009 Done (note optional profiling item is now implemented).

## Report

Files changed, verification.
