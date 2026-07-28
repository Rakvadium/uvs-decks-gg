---
name: scheduled-reviewer
description: >-
  Scheduled or on-demand UI/UX and codebase review that only creates GitHub
  issues (needs-human by default). Use for weekly reviews, audit passes,
  Automations cron prompts, or when the user asks to find tasks without
  implementing them.
---

# Scheduled reviewer

Canonical: `docs/agent-os.md` · `docs/agent-issue-queue.md`

**Review and file tasks only. Do not edit application code or open fix PRs.**

Use `create-task` rules for each issue (dedupe, Goal/Done when/Context, labels).

## Scope

Honor the user’s scope. If none:

- Rotate: shell → gallery → decks → community → admin → convex structure
- Or skim recent churn (`git log --since=14.days --name-only`)

Read only what applies: `docs/UI_UX_DESIGN.md`, `docs/floating-header-islands.md`, `docs/component-architecture-playbook.md`, `docs/SYSTEM_ANALYSIS.md`, and neighbor code.

For UI surfaces, apply `ui-ux-adversary` *judgment* without implementing.

## Process

1. List open issues (`gh issue list`) — skip duplicates.
2. Gather findings (max **8** new issues unless user sets another cap).
3. For each finding, create one issue via `create-task` standards:
   - Default label: `needs-human`
   - `agent-ready` + `size/S` only if trivial, unambiguous, and Done when is crisp
   - Never file taste-only nits unless they violate documented ladders/placement
4. Summarize:

| Issue | Area | Size | Readiness | Why it matters |
| --- | --- | --- | --- | --- |

5. Stop. Do not start `hardened-coding` or `backlog-worker` unless the user explicitly asks after the summary.

## Automation prompt

```text
Use scheduled-reviewer.
Follow docs/agent-os.md.
Do not implement or open fix PRs.
Scope: <shell | gallery | decks | community | convex | rotate>
Cap: 8 new issues.
Deduplicate against open issues first.
Label needs-human by default; agent-ready+size/S only for trivial unambiguous fixes.
```

## Forbidden

- Implementing fixes
- Opening PRs
- Flooding the queue (> cap)
- Stripping `needs-human` from ambiguous UI/IA findings
- Recreating closed/duplicate issues
