---
name: hardened-convex-ops
description: >-
  Closed-loop Convex/ops diagnosis and fix workflow with investigate-first
  context, evidence queue, and adversarial review. Use for failing functions,
  schema/data issues, deploy health, env problems, or when the user asks for a
  hardened Convex ops loop.
---

# Hardened Convex ops loop

Canonical ritual: `docs/agent-workflow-playbook.md`.

## Phase 0 — Context gate (mandatory)

Run `project-context-gate` first with backend focus:

- `docs/SYSTEM_ANALYSIS.md`
- relevant feature docs
- neighbor functions in `convex/`
- existing auth/access helpers

No mutations or code edits before the Context Brief exists.

## Done-When defaults

- Root cause named with evidence (logs, insights, readonly repro)
- Fix on dev first
- Exact repro passes
- Failure logs for that path clean or explained
- No prod mutation unless user explicitly approves

## Prep

1. Identify deployment (prefer dev).
2. Build `failures` queue from failure logs, insights (OCC / read limits), readonly repro.
3. Note forbidden: prod writes, auth weakening, broad deletes, secret dumping.

## Loop

1. Claim one failure class.
2. Implementer: smallest fix matching neighbor Convex patterns.
3. Adversary (diff + symptom + failure entry only): why not fixed, concurrency/auth/env edges, unsafe data changes.
4. Fixer applies valid findings.
5. Verifier reruns the exact repro and rechecks logs/insights.
6. Record evidence on the queue.

## Stop / escalate

Stop when the symptom’s failure queue is cleared on the target deployment.

Escalate for prod mutations, destructive cleanup, unclear deployment, or two failed fix attempts on the same root cause.
