# Handoff — DND-001 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — Drag and Drop performance, row **DND-001** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope (this unit only)

Implement **DND-001**: In `src/lib/dnd/tcg-dnd-provider.tsx`, the `DragOverlay` component must **not** call `setState` on every `mousemove` / `touchmove`. Drive position with a **ref** to the translated node and **`requestAnimationFrame`** coalescing, or update **`transform`** on the DOM node imperatively without a React render per move.

Do **not** implement DND-002 or other rows in the same change set unless unavoidable (prefer isolating DND-001).

## Acceptance

- While dragging, overlay position updates track the pointer without per-move React state updates for x/y.
- Existing drag flows still work (mouse + touch): gallery, deck sidebar, deck details, tier lists — smoke mentally or quickly in dev if possible.
- `bun run lint` and `bun run build` from repo root (note pre-existing lint failures if any; do not introduce new ones in touched files).
- Update [CHANGELOG.md](../CHANGELOG.md) `[Unreleased]` with one bullet for DND-001.
- Set **DND-001** to **Done** in [BACKLOG.md](../BACKLOG.md); clear the orchestration parenthetical from the Status cell.

## Report back

Files changed, lint/build result, and any follow-ups for the orchestrator.
