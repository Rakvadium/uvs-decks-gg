# Handoff — DND-002 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **DND-002** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope

In `src/lib/dnd/tcg-dnd-provider.tsx`, `DragOverlay` outer wrapper currently includes `transition-transform duration-75 ease-out`. Remove continuous transform transition so the ghost tracks the pointer without easing lag. You may keep a transition only for mount/teardown if you add explicit enter/exit handling; default is no transition on the moving overlay.

Do not implement other DND rows.

## Acceptance

- No `transition-transform` (or equivalent) causing lag during active drag.
- `bun run lint` / `bun run build` from repo root; fix issues you introduce.
- [CHANGELOG.md](../CHANGELOG.md) `[Unreleased]` bullet for DND-002.
- **DND-002** → **Done** in BACKLOG; remove orchestration parenthetical.

## Report

Files changed, verification, blockers.
