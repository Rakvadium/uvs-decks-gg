# Handoff — DND-006 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **DND-006** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope

`src/components/community/tier-lists/detail-view/lane-row.tsx`: the droppable lane uses `transition-all` and `scale-[1.005]` when `isOver`. Rapid `activeDropZone` updates during drag can cause layout thrash / visual fighting.

Replace `transition-all` with **narrow** transitions (e.g. only `box-shadow`, `border-color`, `background-color`) or remove transitions during drag hover. Prefer **no scale transform** on the lane during drag-over, or isolate scale to a non-layout-affecting visual (e.g. ring/outline) if you must keep emphasis.

Do not change `useTcgDroppable` wiring except as needed for styling (DND-005 already landed).

## Acceptance

- Tier list lane hover during drag feels stable; no obvious jitter from transition + hit-testing churn.
- `bun run build` passes.
- CHANGELOG + BACKLOG DND-006 Done.

## Report

Files changed, verification.
