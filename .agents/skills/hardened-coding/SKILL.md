---
name: hardened-coding
description: >-
  Closed-loop coding workflow with investigate-first Context Brief, adversarial
  review, visual before/after when UI changes, and verification. Use when
  implementing features/bugfixes in this repo, when the user asks for a hardened
  coding loop, or when prior agent passes drifted UI/style.
---

# Hardened coding loop

Canonical ritual: `docs/agent-workflow-playbook.md`.

## Phase 0 — Context gate (mandatory)

Run `project-context-gate` first. Produce a Context Brief. No edits before that.

If UI is in scope:

- Brief must include Placement plan + Visual verify section
- Capture BEFORE snapshots (desktop + mobile) on listed routes after auth/setup, before edits

## Roles

1. Implementer — smallest slice toward Done-When  
2. Adversary — diff + Done-When + Context Brief only; assumes wrong  
3. Fixer — valid adversary findings only  
4. Verifier — same objective check again  

## Queue

- baseline repro / missing behavior  
- acceptance checks  
- UI adversary + visual compare if UI files change  

## Loop

1. Claim one queue item in the touch list.  
2. Implementer: smallest change; match neighbors; no drive-by restyles.  
3. Adversary: regressions, placement/style drift vs brief + `docs/UI_UX_DESIGN.md`, auth/schema risks, stubs/fake-green/scope creep.  
4. Fixer applies valid findings.  
5. Verifier: `bun run lint` && `bun run build` (+ targeted check).  
6. Update queue with evidence.  

## UI completion gate

If any UI file changed:

1. Capture AFTER snapshots (same routes/viewports/states as BEFORE).  
2. Run `ui-ux-adversary` on diff/routes; adversary must compare BEFORE vs AFTER when images exist.  
3. Clear must-fix findings before claiming done.  
4. Confirm placement still matches Context Brief / floating-header inventory.
5. If opening a PR: commit captures to `.github/pr-captures/<issue>/` and embed Before **and** After with raw GitHub URLs. Never use `cursor.com/artifacts` in the PR body (they expire; GitHub usually shows only Before). See `docs/agent-workflow-playbook.md` § PR visual embeds.  

## Forbidden

Editing before Context Brief; inventing placement; destructive git; skipping/weakening tests or CI; stubbing to pass; unrelated refactors; committing unless asked.

## Stop / escalate

Stop when Done-When true, verifier green, UI adversary clean of must-fix (if UI), visual compare done (if UI).

Escalate when blocked twice on the same failure, placement ambiguous, or product/auth decision required.
