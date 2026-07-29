---
name: pr-issue-verify
description: >-
  Reviews a pull request against its linked GitHub issue and verifies each Done
  when item with evidence. Use when a PR opens/pushes, when asked whether a PR
  fixes an issue, or for issue-completion review before merge. Comments on the
  PR; does not merge unless asked.
---

# PR issue verify

Canonical: `docs/agent-os.md`

**Job:** Prove the PR completes the linked issue — or say clearly that it does not.  
**Not the same as** `hardened-pr-babysit` (CI/conflicts). Run babysit only if merge-readiness is also requested.

## Inputs

- PR number/URL, or infer from automation event context
- Linked issue from PR body (`Fixes #N` / `Closes #N`) or closing references; if missing, stop and comment that the PR must link an issue

## Steps

1. **Load context**

```bash
gh pr view <pr> --json number,title,body,baseRefName,headRefName,files,commits,statusCheckRollup,url
gh pr diff <pr>
```

**Base branch:** agent PRs must target `dev`. If `baseRefName` is `master` or `main`, verdict cannot be `fixes issue` until retargeted — note as blocker (`gh pr edit <pr> --base dev`).

Resolve issue number from body. Then:

```bash
gh issue view <n> --json number,title,body,labels,url
```

Parse Goal, Done when, Context, Out of scope (and auth/viewport notes if present).

2. **Scope check**
   - Diff advances the Goal
   - Nothing material in Out of scope was changed without justification
   - One issue ↔ this PR (flag bundled unrelated work)

3. **Done-when verification** (each checkbox)
   - Map to code and/or runtime evidence
   - UI issues (`area/ui`, `area/shell`, or UI files in diff):
     - Prefer checkout/PR branch in cloud/local env
     - Repro from issue Context (auth + viewport if specified)
     - Screenshot or short recording proving the fix
   - Non-UI: tests, typecheck/lint output, or precise code citation

4. **CI signal** (secondary)
   - Note failing required checks; they block “fixes issue” if they prevent confidence
   - Do not rewrite CI to pass

5. **Verdict**
   - `fixes issue` — every Done when item passes with evidence
   - `partial` — some items pass; list gaps
   - `does not fix` — Goal unmet or critical Done when failed

6. **Comment on the PR** (required)

```markdown
## Issue completion review
**Issue:** #<n> — <title>
**Verdict:** fixes issue | partial | does not fix

### Done when
- [x] or [ ] <item> — evidence: ...
- [x] or [ ] <item> — evidence: ...

### Scope
- Base branch: `dev` | wrong (`master`/`main`) — ...
- In scope: ...
- Out of scope / drive-by: ...

### Artifacts
- Screenshots/recordings: ... (or N/A)

### Blockers
- ...
```

7. **Fixing**
   - Default: **do not implement** unless the user/automation says “fix gaps in this PR”
   - If allowed: only fix clear gaps for this issue; re-run verification; do not merge unless asked

## Automation prompt

```text
Use pr-issue-verify.
Follow docs/agent-os.md.
PR: from event context (or #<pr>).
Resolve linked issue via Fixes/Closes #N.
Confirm base branch is `dev` (flag master/main as blocker).
Post the Issue completion review comment on the PR.
Do not merge.
Do not implement unless the PR only needs a trivial gap fix and you state what you changed.
For UI: repro with correct auth/viewport and attach screenshot/recording evidence.
Model policy: prefer single-agent work; if sub-agents are required use composer-2.5 only; never Sonnet/Opus.
```

## Forbidden

- Merging without explicit ask
- Approving “fixes issue” without evidence per Done when item
- Ignoring wrong base branch (`master`/`main` instead of `dev`)
- Ignoring Out of scope drive-by changes
- Filing a new issue instead of reviewing (unless you discover a separate bug — then use create-task and still complete this review)
