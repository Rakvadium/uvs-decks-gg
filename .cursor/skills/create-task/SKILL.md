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

## Labels vs body (critical)

`size/*`, `area/*`, `needs-human`, and `agent-ready` are **GitHub issue labels**, not markdown sections.

- Apply them only with `gh issue create --label ...` and/or `gh issue edit --add-label ...`
- **Do not** put `## Size` / `## Area` in the issue body as a substitute for labels
- Body may mention size/area in prose if helpful; labels are what the queue uses

## Steps

1. **Clarify** the outcome in one sentence. If IA/product is ambiguous, readiness = `needs-human`.
2. **Deduplicate**

```bash
gh issue list --state open --limit 50 --json number,title,labels,body
```

If an open issue already covers it, comment on that issue instead of creating a duplicate.

3. **Draft body** (no Size/Area heading sections):
   - Goal (one sentence)
   - Done when (checklist, observable)
   - Context (routes/files/docs links — do not paste whole playbooks)
   - Out of scope

4. **Choose labels** (exactly these GitHub labels):
   - Size: one of `size/S` | `size/M` | `size/L`
   - Area: one of `area/ui` | `area/convex` | `area/admin` | `area/shell` | `area/docs` | `area/other`
   - Readiness (pick exactly one):
     - `size/S` or `size/M` → `agent-ready` (when Goal/Done when are clear enough to execute)
     - `size/L` (or larger / needs product IA) → `needs-human`
     - If S/M is still ambiguous (unclear Done when or placement), use `needs-human` instead of guessing
   - Never combine `agent-ready` with `needs-human` or `blocked`

5. **Create with labels on the command**

```bash
gh issue create \
  --title "[agent] <short outcome>" \
  --body "$(cat <<'EOF'
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
EOF
)" \
  --label "agent-ready" \
  --label "size/M" \
  --label "area/ui"
```

Swap the size/area/readiness labels for the chosen ones (`agent-ready` + `size/S|M`, or `needs-human` + `size/L`). Every create **must** include at least `size/*`, `area/*`, and readiness.

6. **Verify labels landed**

```bash
gh issue view <n> --json number,labels --jq '{number, labels: [.labels[].name]}'
```

If `size/*` or `area/*` is missing:

```bash
gh issue edit <n> --add-label "size/S" --add-label "area/ui"
```

Do not report the issue as done until that JSON shows the required labels.

7. **Report** URL/number + label list. Stop.

## Forbidden

- Implementing the fix
- Writing `## Size` / `## Area` in the body instead of applying labels
- Creating an issue with only body text and no `--label` flags
- Creating multiple issues for one request without asking
- Marking `size/L` as `agent-ready` (L stays `needs-human`)
- Marking clear `size/S` or `size/M` as `needs-human` without stating the ambiguity
- Filing vague tasks (“improve UI”) without Done when
