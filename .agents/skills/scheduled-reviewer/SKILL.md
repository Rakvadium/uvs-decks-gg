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

Use `create-task` for every issue. That skill requires real GitHub labels via `--label`, not Size/Area markdown in the body.

## Scope

Honor the user’s scope. If none:

- Rotate: shell → gallery → decks → community → admin → convex structure
- Or skim recent churn (`git log --since=14.days --name-only`)

Read only what applies: `docs/UI_UX_DESIGN.md`, `docs/floating-header-islands.md`, `docs/component-architecture-playbook.md`, `docs/SYSTEM_ANALYSIS.md`, and neighbor code.

For UI surfaces, apply `ui-ux-adversary` *judgment* without implementing.

## Process

1. List open issues (`gh issue list`) — skip duplicates.
2. Gather findings (max **8** new issues unless user sets another cap).
3. For each finding, create one issue via `create-task`:
   - Real labels: one `size/*`, one `area/*`, and readiness
   - `size/S` or `size/M` → `agent-ready` when Done when is clear
   - `size/L` → `needs-human`
   - Ambiguous S/M → `needs-human` (do not guess)
   - Never file taste-only nits unless they violate documented ladders/placement
   - After each create, confirm labels with `gh issue view <n> --json labels`
4. Summarize (labels column must be real GH labels, not body text):

| Issue | GH labels | Surface | Why it matters |
| --- | --- | --- | --- |

5. Stop. Do not start `hardened-coding` or `backlog-worker` unless the user explicitly asks after the summary.

## Automation prompt

```text
Use scheduled-reviewer and create-task.
Follow docs/agent-os.md.
Do not implement or open fix PRs.
Scope: <shell | gallery | decks | community | convex | rotate>
Cap: 8 new issues.
Deduplicate against open issues first.

LABELS ARE MANDATORY (GitHub labels, not markdown):
- Every issue: gh issue create ... --label size/S|M|L --label area/ui|shell|... --label agent-ready|needs-human
- Readiness: size/S or size/M → agent-ready; size/L → needs-human
- Do NOT write ## Size / ## Area in the issue body as a substitute
- After create: gh issue view N --json labels — fix with gh issue edit --add-label if missing
```

## Forbidden

- Implementing fixes
- Opening PRs
- Flooding the queue (> cap)
- Body-only size/area without GitHub labels
- Stripping `needs-human` from ambiguous UI/IA findings
- Recreating closed/duplicate issues
