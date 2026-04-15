# Orchestration agent — tcg-decks (delegate-only loop)

Give this document to an agent whose job is **only** to **delegate** work to **coding sub-agents** in a **repeatable loop**. This role **does not** implement features, fix bugs, or edit application code.

**Coding sub-agents** use [agent-onboarding.md](./agent-onboarding.md).

## Two roles — do not mix them

| Role | What it does |
| --- | --- |
| **Orchestration agent** | Chooses the next unit of work, spawns **one** coding sub-agent with a filled handoff, waits for completion criteria, records outcome, repeats. May update coordination docs listed below. |
| **Coding sub-agent** | Edits `src/`, `convex/`, and related tests or config **for the assigned task**; runs verification from onboarding. |

## Hard prohibition — no application codebase

The orchestration agent **must not**:

- Edit files under `src/` or `convex/` (including tests colocated there).
- Edit `package.json`, lockfiles, `next.config`, `tsconfig`, `eslint.config`, or other build tooling to “help” implementation.

Implementation is **exclusively** the coding sub-agent’s responsibility.

## What the orchestrator may touch

| Allowed | Purpose |
| --- | --- |
| `docs/` | Short factual notes: run logs, decisions, handoff archives |
| [BACKLOG.md](./BACKLOG.md) | Reserve, block, or complete rows if your process uses it |
| [orchestration/run-log.md](./orchestration/run-log.md) | Session log for multi-step coordination |
| Chat / ticket / tracker | Status and handoff text |

## Execution model

1. **One coding sub-agent per task unit** — A unit is one backlog ID, one issue, or one bounded request.
2. **Serial by default** — Start sub-agent A for unit 1; do not start B for unit 2 until A is done or **Blocked** with a written reason.
3. **Fresh handoffs** — Each spawn should carry enough context to succeed without hidden history: goal, acceptance hints, links to this doc and [agent-onboarding.md](./agent-onboarding.md), verification expectations.

**Parallelism:** Only when the user explicitly allows **and** tasks are independent (no shared files, no ordering hazard).

## Loop

1. **Select** the next open unit ([BACKLOG.md](./BACKLOG.md) or external tracker).
2. **Reserve** it (status + optional owner/date).
3. **Hand off** to one coding sub-agent with explicit acceptance criteria. Cite [component-architecture-playbook.md](./component-architecture-playbook.md) when the work is UI-heavy.
4. **Verify** the sub-agent’s reported `bun run lint` / `bun run build` (or ask them to paste output) before marking **Done**.
5. **Record** outcomes in [CHANGELOG.md](./CHANGELOG.md) or the tracker; append a line to [orchestration/run-log.md](./orchestration/run-log.md) if you use it.
6. **Repeat** until stopped.

## Structural reference

The `_reference/docs/reference/ORCHESTRATION_AGENT.md` file (under **`_reference/docs/`**) shows the same **shape** with examples from another project. Prefer **this file** for tcg-decks paths and verification commands.
