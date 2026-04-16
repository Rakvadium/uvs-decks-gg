# Handoff — DND-005 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **DND-005** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope

Stabilize `useTcgDroppable` dependencies at call sites so `registerDropZone` effect does not re-run every render from inline `accepts` / `onDrop`:

1. `src/components/deck-details/deck-details-cards-section-model.ts` — replace `accepts: ["card"]` with imported `TCG_DND_ACCEPTS_CARD_ONLY` (pattern: `src/components/gallery/active-deck-sidebar/section/hook.ts`). `handleDropToActiveSection` is already `useCallback`; keep it stable.

2. `src/components/community/tier-lists/detail-view/lane-row.tsx` — `accepts: canEdit ? ["card"] : []` allocates new arrays each render. Use module-level stable sentinels (e.g. empty tuple/const) and/or `useMemo` so reference identity is stable when `canEdit` unchanged. Replace inline `onDrop: (item) => ...` with `useCallback` that depends on `moveCardToLane` and `tier.id`.

Do **not** change lane CSS transitions here (that is DND-006). Do not implement DND-006 in this task.

## Acceptance

- `bun run build` passes.
- CHANGELOG + BACKLOG DND-005 Done.

## Report

Files changed, verification.
