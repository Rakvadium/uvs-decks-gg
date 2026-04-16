# Handoff — DND-008 (coding sub-agent)

**Backlog:** [BACKLOG.md](../BACKLOG.md) — **DND-008** only.

**Onboarding:** [agent-onboarding.md](../agent-onboarding.md).

## Scope

Add a **short manual regression checklist** for card drag-and-drop under `docs/` (new file `docs/dnd-regression-checklist.md` is appropriate).

Cover at minimum:

- Gallery grid → active deck sections (main / side / reference if present in UI).
- Reorder within active deck sidebar.
- Deck details page: drop into active section strip/target.
- Community tier list builder: drag between lanes; fast pointer moves across lane boundaries.
- Optional: `?dndDebug=1` or localStorage `tcg:dndDebug` for debug logging if documented elsewhere — link to SYSTEM_ANALYSIS or onboarding only if accurate.

Optionally add one line in `docs/smoke-checklist.md` pointing to this checklist if that file exists and fits the repo style.

No application code unless a trivial doc link is needed.

## Acceptance

- New doc is concise and actionable (checkbox list).
- `bun run build` still passes (no code changes expected; if only docs, build is unchanged but run anyway per onboarding habit).
- CHANGELOG + BACKLOG DND-008 Done.

## Report

Files created/changed.
