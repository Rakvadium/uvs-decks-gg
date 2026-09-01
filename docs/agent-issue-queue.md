# Agent issue queue

Label and lifecycle detail for the GitHub Issues queue.

**OS (start here):** [agent-os.md](./agent-os.md)  
**Ritual:** [agent-workflow-playbook.md](./agent-workflow-playbook.md)  
**Template:** [.github/ISSUE_TEMPLATE/agent-task.yml](../.github/ISSUE_TEMPLATE/agent-task.yml)

**GitHub Issues with labels are the only claimable queue.** `docs/BACKLOG.md` is legacy scratch — promote rows to issues; do not auto-claim from it.

---

## Labels (create once per repo)

```bash
gh label create "agent-ready" --color "0E8A16" --description "Safe for backlog-worker to claim"
gh label create "needs-human" --color "D93F0B" --description "Ambiguous IA/product — do not auto-claim"
gh label create "blocked" --color "B60205" --description "Waiting on dependency or decision"
gh label create "size/S" --color "C5DEF5" --description "Small — auto-claim OK"
gh label create "size/M" --color "BFD4F2" --description "Medium — one PR, usually human-started"
gh label create "size/L" --color "D4C5F9" --description "Large — break down before agents"
gh label create "area/ui" --color "FBCA04" --description "UI / UX"
gh label create "area/convex" --color "5319E7" --description "Convex / backend"
gh label create "area/admin" --color "006B75" --description "Admin"
gh label create "area/shell" --color "1D76DB" --description "App shell / sidebars / chrome"
gh label create "area/docs" --color "D4C5F9" --description "Documentation"
gh label create "area/other" --color "EDEDED" --description "Other"
```

Ignore errors if a label already exists.

---

## Queue filter (what workers pull)

Default auto-claim:

```text
is:issue is:open label:agent-ready (label:size/S OR label:size/M) -label:blocked -label:needs-human
```

Sort: `size/S` before `size/M`, then oldest first.

Do **not** auto-claim `size/L` (those stay `needs-human` until a human breaks them down or explicitly delegates).

## Readiness by size

| Size | Default readiness |
| --- | --- |
| `size/S` | `agent-ready` |
| `size/M` | `agent-ready` |
| `size/L` | `needs-human` |

If an S/M issue is still ambiguous, use `needs-human` instead of guessing.

---

## Ticket lifecycle

```text
Create (Agent task template)
  → add size/* + area/* labels
  → stays agent-ready

backlog-worker claims
  → comment "Claimed by agent"
  → remove agent-ready (optional) or leave and rely on assignee/In progress comment
  → implement via playbook
  → open PR into **`dev`** with Fixes #N

Human reviews / merges into `dev`
  → close issue
```

If blocked: comment why, add `blocked` or `needs-human`, stop that item.

---

## One issue → one PR

- Head branch: `agent/<issue-number>-short-slug`
- Base branch: always **`dev`** (never `master` / `main`)
- PR body references `Fixes #<issue-number>`
- Example: `gh pr create --base dev --title "..." --body "Fixes #N\n\n..."`
- UI PRs: embed Before **and** After from `.github/pr-captures/<issue>/` using raw GitHub URLs. Never paste `cursor.com/artifacts` links (they expire; GitHub usually keeps only Before). See [agent-workflow-playbook.md](./agent-workflow-playbook.md) § PR visual embeds.
- Do not batch unrelated issues into one PR

---

## Promoting from BACKLOG.md (legacy)

1. Pick an Open row from [BACKLOG.md](./BACKLOG.md).
2. Use `create-task` or the **Agent task** issue template.
3. Add `size/*` + `area/*` (+ readiness).
4. Mark the backlog row Done and link `#<issue>`.
