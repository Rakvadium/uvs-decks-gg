---
name: hardened-pr-babysit
description: >-
  Keep a PR merge-ready with investigate-first fixes, conflict/CI/comment
  queueing, adversarial review, and UI adversary when UI changes. Use when
  babysitting a PR, clearing review/CI, or the user asks for a hardened PR loop.
---

# Hardened PR babysit

Canonical ritual: `docs/agent-workflow-playbook.md`.

## Phase 0 — Context before fixes

For each fix batch:

1. Snapshot PR: mergeability, checks, unresolved comments only.
2. If the fix needs product/UI/codebase context, run `project-context-gate` for that item and write/update a Context Brief.
3. Do not “just make CI green” by inventing unrelated UI or weakening checks.

## Done-When

- No merge conflicts
- Required CI green
- Unresolved review/Bugbot comments triaged (fixed or disputed with evidence)
- PR mergeable
- If UI files changed: `ui-ux-adversary` run (with BEFORE/AFTER visual compare when possible); must-fix cleared or explicitly waived by the user

## Queue priority

1. Merge conflicts
2. CI failures in PR scope
3. Valid review / Bugbot findings
4. UI adversary if UI touched

## Loop

1. Claim top queue item.
2. Investigate neighbors/docs if the fix touches structure or UI (context gate).
3. Implementer: scoped fix only; match existing patterns.
4. Adversary on the fix diff: assume wrong; reject CI cheats, skipped tests, unrelated cleanups, placement drift.
5. Fixer applies valid findings.
6. Push and re-watch checks / comments / conflicts.
7. Update queue.

## Rules

- Never edit CI workflows only to force green.
- Sync with base before treating possibly-unrelated failures as PR bugs.
- Validate Bugbot; dispute with evidence when wrong.
- If conflict intents collide, stop and ask.
- Max ~5 push/recheck cycles, then report blockers.
- Do not merge unless asked.
