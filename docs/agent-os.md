# Agent OS

One page for how work enters the system, how it is routed, and which workflows run.

| Layer | What | Where |
| --- | --- | --- |
| **Tasks** | Features, bugs, improvements | GitHub Issues |
| **Routing** | Labels decide which workflow | `area/*`, `size/*`, readiness labels |
| **Workflows** | Thorough, named skills | `.agents/skills/` (mirrored in `.cursor/skills/`) |
| **Triggers** | Manual chat, or criteria/schedule | You / Cursor Automations |

Deeper detail: [agent-issue-queue.md](./agent-issue-queue.md) · [agent-workflow-playbook.md](./agent-workflow-playbook.md) · [AGENTS.md](../AGENTS.md)

`docs/BACKLOG.md` is **legacy scratch only**. Do not treat it as the live queue.

---

## 1. Tasks — create and manage

### Manual (human)

1. GitHub → **New issue** → template **Agent task**
2. Fill **Goal**, **Done when**, **Context**, **Out of scope**
3. Add labels:
   - one `size/S|M|L`
   - one `area/ui|convex|admin|shell|docs|other`
   - readiness: `agent-ready` **or** `needs-human` (default to `needs-human` if unsure)

Template: [.github/ISSUE_TEMPLATE/agent-task.yml](../.github/ISSUE_TEMPLATE/agent-task.yml)

### Agent-created

| Skill | Purpose |
| --- | --- |
| `create-task` | Turn a description / finding into one well-formed issue |
| `scheduled-reviewer` | Review UI/code on a cadence; **only** file issues (no implementation) |

Both use the same issue shape and labels. Reviewer defaults to `needs-human` unless the finding is tiny and unambiguous (`agent-ready` + `size/S`).

### Manage

| Label | Meaning |
| --- | --- |
| `agent-ready` | Safe to auto-claim / run worker |
| `needs-human` | Ambiguous — do not auto-implement |
| `blocked` | Waiting on dependency/decision |
| `size/S` | Auto-claim OK |
| `size/M` / `size/L` | Human-started unless you override |
| `area/*` | Routes to a workflow family |

Lifecycle: create → label → claim → PR (`Fixes #N`) → human merge → close.  
One issue → one PR. Branch: `agent/<n>-short-slug`.

---

## 2. Delegation — send a task into a workflow

### Manual

In chat, name the workflow and the issue (or paste the goal):

```text
Use hardened-coding on issue #42.
Follow docs/agent-os.md and docs/agent-workflow-playbook.md.
```

Or for Convex ops / PR babysit / UI adversary — use the skill names in the table below.

### By criteria (automatic routing)

**Claim filter** (what `backlog-worker` pulls):

```text
is:issue is:open label:agent-ready label:size/S -label:blocked -label:needs-human
```

**Area → workflow** (after claim or when you delegate):

| Labels / criteria | Workflow |
| --- | --- |
| `area/ui`, `area/shell`, `area/admin` (implementation) | `project-context-gate` → `hardened-coding` → `ui-ux-adversary` if UI touched |
| `area/convex` diagnosis/fix | `project-context-gate` → `hardened-convex-ops` |
| `area/convex` feature work | `project-context-gate` → `hardened-coding` |
| `area/docs` | `project-context-gate` → docs-only `hardened-coding` |
| Open PR needs cleanup | `hardened-pr-babysit` |
| PR must prove it fixes the issue | `pr-issue-verify` |
| Next ready ticket (no issue chosen) | `backlog-worker` |

### Triggers to configure (outside the repo)

| Trigger | What to run | Where |
| --- | --- | --- |
| You paste a prompt | Any workflow skill | Cursor chat |
| Schedule (e.g. weekly) | `scheduled-reviewer` | [cursor.com/automations](https://cursor.com/automations) — see prompt below |
| “Drain ready work” | `backlog-worker` (cap 1–3) | Chat or Automation |
| PR opened / pushed | `pr-issue-verify` | Automations — see paste prompt below |

Reviewer must **not** implement. Worker must **not** invent tasks.

---

## 3. Workflows — purpose and thoroughness

Every implementation path starts with **`project-context-gate`** (Context Brief before edits).

| Workflow | Purpose | Thoroughness bar |
| --- | --- | --- |
| `create-task` | File one issue correctly | Dedupe open issues; Goal/Done when/Context; labels |
| `scheduled-reviewer` | Find problems; file issues only | Cap findings; prefer `needs-human`; no code changes |
| `project-context-gate` | Investigate before coding | Docs + neighbors + placement/visual plan |
| `hardened-coding` | Ship a change | Brief → slices → adversary → lint/build → UI visual verify |
| `hardened-convex-ops` | Fix Convex/ops with evidence | Dev first; logs/insights/repro; no auth weakening |
| `ui-ux-adversary` | Scrutinize UI | Placement, tokens, neighbors, BEFORE/AFTER images |
| `hardened-pr-babysit` | Merge-ready PR | Conflicts → CI → comments → UI check if needed |
| `pr-issue-verify` | Issue completion on a PR | Each Done when item evidenced; PR comment verdict |
| `backlog-worker` | Claim queue item + route | One issue per PR; playbook gates |

Shared laws (full text in playbook): neighbors beat novelty; header slots fixed; tokens over taste; no drive-by polish; ambiguity → ask; update docs when behavior/architecture changes.

---

## Paste prompts

### Create a task

```text
Use create-task.
Turn this into one GitHub Agent-task issue with correct labels.
Default readiness: needs-human unless it is clearly size/S and unambiguous — then agent-ready.
```

### Run scheduled review (also for Cursor Automations)

```text
Use scheduled-reviewer.
Follow docs/agent-os.md.
Do not implement or open fix PRs.
Scope: <shell | gallery | decks | community | convex | rotate>
Cap: 8 new issues.
Deduplicate against open issues first.
Label needs-human by default; agent-ready+size/S only for trivial unambiguous fixes.
```

### Delegate one issue

```text
Follow docs/agent-os.md.
Use the workflow for issue #<n> based on its area/* labels.
Open a PR with Fixes #<n> when done (unless I say not to commit).
```

### Drain ready queue

```text
Use backlog-worker.
Follow docs/agent-os.md.
Cap: 1 issue.
Open a PR with Fixes #N when done.
```

### Verify PR completes the issue (Automations: PR opened / pushed)

```text
Use pr-issue-verify.
Follow docs/agent-os.md.
PR: from event context.
Resolve linked issue via Fixes/Closes #N in the PR body.
For each Done when item: pass/fail with evidence (UI: repro + screenshot/recording with correct auth/viewport).
Post an "Issue completion review" comment on the PR with verdict: fixes issue | partial | does not fix.
Do not merge.
Do not implement unless only a trivial in-scope gap remains and you state what you changed.
Model policy: single-agent when possible; sub-agents only if needed and must use composer-2.5; never Sonnet/Opus.
```

---

## Cursor Automations (optional setup)

1. Open [cursor.com/automations](https://cursor.com/automations)
2. **Weekly UI review:** schedule + repo + scheduled-reviewer prompt (scope: rotate UI surfaces)
3. **Biweekly code/convex review:** same with scope convex/structure
4. Optionally a separate automation: “run backlog-worker cap 1” only if you want unattended implementation of `agent-ready`+`size/S` (keep human merge)
5. **PR issue verify:** trigger Pull request opened + Pull request pushed → `pr-issue-verify` prompt above; enable Comment on PR + computer use for UI

---

## Quick “what do I do?”

| I want to… | Do this |
| --- | --- |
| Add work myself | Agent task issue + labels |
| Have an agent add work | `create-task` or `scheduled-reviewer` |
| Do a specific task now | Name workflow + issue/goal |
| Process next ready task | `backlog-worker` |
| Check a PR fixed the issue | `pr-issue-verify` |
| Tweak a workflow | Edit that skill’s `SKILL.md` under `.agents/skills/` (mirror to `.cursor/skills/`) |
