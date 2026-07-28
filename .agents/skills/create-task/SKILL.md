---
name: create-task
description: >-
  Creates one well-formed GitHub Agent-task issue (Goal, Done when, Context,
  labels). Use when the user asks to file a task, create an issue for a bug or
  feature, turn a finding into queue work, or add work to the agent issue queue.
  Does not implement the task.
---

# Create task

Canonical: `docs/agent-os.md` · `docs/agent-issue-queue.md`

**Do not implement.** Only create (or update) a GitHub issue.

## Steps

1. **Clarify** the outcome in one sentence. If IA/product is ambiguous, readiness = `needs-human`.
2. **Deduplicate**

```bash
gh issue list --state open --limit 50 --json number,title,labels,body
```

If an open issue already covers it, comment on that issue instead of creating a duplicate.

3. **Draft** fields matching the Agent task template:
   - Goal (one sentence)
   - Done when (checklist, observable)
   - Context (routes/files/docs links — do not paste whole playbooks)
   - Out of scope
   - Size: `size/S` | `size/M` | `size/L`
   - Area: `area/ui` | `area/convex` | `area/admin` | `area/shell` | `area/docs` | `area/other`

4. **Readiness**
   - Default: `needs-human`
   - Use `agent-ready` only when size is `size/S`, Done when is testable, and placement/IA is unambiguous
   - Never combine `agent-ready` with `needs-human` or `blocked`

5. **Create**

```bash
gh issue create --title "<short outcome>" --body "$(cat <<'EOF'
## Goal
<goal>

## Done when
- [ ] ...
- [ ] `bun run lint` and `bun run build` pass
- [ ] If UI changed: before/after + ui-ux-adversary (no must-fix)

## Context
- ...

## Out of scope
- ...

## Size
size/S

## Area
area/ui
EOF
)" --label "needs-human" --label "size/S" --label "area/ui"
```

Adjust labels to the chosen size/area/readiness. Title may use `[agent]` prefix.

6. **Report** the issue URL/number and labels. Stop.

## Forbidden

- Implementing the fix
- Creating multiple issues for one request without asking
- Auto-marking `size/L` as `agent-ready`
- Filing vague tasks (“improve UI”) without Done when
