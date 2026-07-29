---
name: backlog-worker
description: >-
  Pulls the oldest GitHub Issue labeled agent-ready and size/S, runs the
  hardened playbook on that single task, then opens or prepares a PR. Use when
  the user asks to work the issue queue, run backlog-worker, drain agent-ready
  tickets, or process the next agent task without specifying the task body.
---

# Backlog worker

Canonical docs:

- `docs/agent-os.md` — tasks, routing, workflows
- `docs/agent-issue-queue.md` — labels, filter, lifecycle
- `docs/agent-workflow-playbook.md` — coding ritual

## Default policy

- Claim **one** issue per invocation unless the user sets a higher cap (max **3**).
- Auto-claim: open + `agent-ready` + (`size/S` or `size/M`) + not `blocked` + not `needs-human`.
- Oldest first (`created` ascending); prefer `size/S` before `size/M` when both exist.
- Never auto-claim `size/L`, `needs-human`, or `blocked`.
- GitHub Issues only. If no matching issues, report empty queue. Do not read `docs/BACKLOG.md` unless the user explicitly allows legacy fallback.

## Loop

For each claim (up to cap):

1. **List & pick**

```bash
gh issue list --state open --label "agent-ready" --json number,title,labels,createdAt,body --limit 50
```

Keep only issues that have `size/S` or `size/M`, and exclude any with `blocked`, `needs-human`, or `size/L`. Sort by size (S before M), then `createdAt` ascending. Take the first.

2. **Claim**

```bash
gh issue comment <n> --body "Claimed by backlog-worker. Following docs/agent-workflow-playbook.md."
gh issue edit <n> --remove-label "agent-ready"
```

If claim fails (label race), pick the next issue.

3. **Route**

- Read issue body (Goal, Done when, Context, Out of scope, Size, Area).
- Run `project-context-gate` using the issue as the task.
- Then:
  - `area/convex` → prefer `hardened-convex-ops` when it is a diagnosis/fix; else `hardened-coding`
  - `area/ui` / `area/shell` / `area/admin` → `hardened-coding` (+ visual verify / `ui-ux-adversary` when UI)
  - `area/docs` → docs-only change set; still Context Brief; skip UI adversary unless UI files change

4. **Implement** under hardened rules (brief before edits, no drive-by restyles, lint/build, UI gates).

5. **Finish the ticket**

- If the user asked for a PR / cloud-style completion: open a PR from branch `agent/<n>-short-slug` **into `dev`** (base=`dev`, never `master`/`main`) with `Fixes #<n>` in the body. Example: `gh pr create --base dev --head agent/<n>-short-slug --title "..." --body "Fixes #<n>\n\n..."`. Do not merge unless asked.
- If the user forbade commits/PRs: stop after local verify and summarize; leave a comment on the issue with status and that a PR is still needed.
- If blocked: comment why, add `blocked` or `needs-human`, do not force the task.

6. **Next** only if cap allows and queue still has matches; otherwise stop with a summary table:

| Issue | Result | PR / notes |
| --- | --- | --- |

## Paste prompt

```text
Use backlog-worker.
Follow docs/agent-os.md.
Cap: 1 issue.
Open a PR into base `dev` (not master/main) with Fixes #N when the task is done (unless I say not to commit).
```

## Forbidden

- Inventing tasks when the queue is empty
- Claiming multiple issues into one PR
- Opening PRs against `master` or `main` (always target `dev`)
- Stripping `needs-human` to force work
- Skipping Context Brief / UI adversary for UI issues
- Merging PRs unless explicitly asked
