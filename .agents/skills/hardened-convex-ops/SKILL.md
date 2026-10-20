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
- Fix proven on a local backend (`127.0.0.1`/`localhost`) or by readonly repro
- Exact repro passes
- Failure logs for that path clean or explained
- Nothing written or deployed to the cloud deployment without explicit human approval

## Prep

1. Follow the Convex command rules in `AGENTS.md` § Secrets and live data. The cloud deployment (the one Convex calls "dev") serves the live site.
   - **Read only, allowed:** only `convex logs`, `convex function-spec`, and env var names through the `AGENTS.md` filter. Every other `convex` command is a write, including `export`, `data`, `mcp start`, `integration`, and any Convex MCP server pointed at the cloud deployment.
   - **Always needs explicit human approval of the exact command:** `convex deploy`, and any target flag (`--prod`, `--url`, `--deployment-name`, `--env-file`, `--admin-key`, `--preview-*`).
   - **Other writes** (`dev`, `run`, `import`, `env set`/`remove`, migrations, and the commands above): once #210 merges, only through `bun run vconvex -- …` against a local backend, after `bun run vconvex -- --check` reports `local`. Until then there is no self-check, so they need explicit human approval of the exact command.
2. Build `failures` queue from failure logs, insights (OCC / read limits), readonly repro.
3. Note forbidden: unapproved writes or deploys to the cloud deployment, auth weakening, broad deletes, secret dumping.

## Loop

1. Claim one failure class.
2. Implementer: smallest fix matching neighbor Convex patterns.
3. Adversary (diff + symptom + failure entry only): why not fixed, concurrency/auth/env edges, unsafe data changes.
4. Fixer applies valid findings.
5. Verifier reruns the exact repro and rechecks logs/insights.
6. Record evidence on the queue.

## Stop / escalate

Stop when the symptom’s failure queue is cleared on the target deployment.

Escalate for any write or deploy to the cloud deployment, destructive cleanup, unclear deployment, or two failed fix attempts on the same root cause.
