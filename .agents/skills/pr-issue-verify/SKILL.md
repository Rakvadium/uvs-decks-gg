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

## Independence

- The verifier is a different agent from the builder. If you built or edited this PR, stop and ask for another agent.
- Reproduce, don't trust. Treat every claim in the PR body as something to re-run. Every PASS cites your own command output, capture or code reading, done at the PR head in your own worktree and on your own ports.

## Inputs

- PR number/URL, or infer from automation event context
- Linked issue from PR body (`Fixes #N` / `Closes #N`) or closing references; if missing, stop and comment that the PR must link an issue

## Steps

1. **Load context**

```bash
gh pr view <pr> --json number,title,body,baseRefName,headRefName,headRefOid,files,commits,statusCheckRollup,url
gh pr diff <pr>
```

**Base branch:** agent PRs must target `dev`. If `baseRefName` is `master` or `main`, verdict cannot be `fixes issue` until retargeted — note as blocker (`gh pr edit <pr> --base dev`).

Resolve issue number from body. Then:

```bash
gh issue view <n> --json number,title,body,labels,url
```

Parse Goal, Done when, Context, Out of scope (and auth/viewport notes if present). On round 2 or later, also list every prior must-fix and should-fix by number.

2. **Scope check**
   - Diff advances the Goal
   - Nothing material in Out of scope was changed without justification
   - One issue ↔ this PR (flag bundled unrelated work)

3. **Done-when verification** (each checkbox)
   - Map to code and/or runtime evidence from your own runs
   - UI issues (`area/ui`, `area/shell`, or UI files in diff):
     - Check out the PR head in your own worktree
     - Repro from issue Context (auth + viewport if specified)
     - Re-capture and compare against the builder's media (`scripts/pr-capture/README.md`)
   - Non-UI: tests, typecheck/lint output, or precise code citation
   - Tooling: break it on purpose and confirm the failure is reported

4. **Security & side effects:** rerun every item of the checklist in `.agents/skills/hardened-coding/SKILL.md` § Security & side effects yourself, at the PR head. Scan the PR's published media, and scan your own media before you publish it. For new targets, look at the deployments and checks that actually ran on each new ref. Report each item in the check table.

5. **CI signal** (secondary)
   - Note failing required checks; they block “fixes issue” if they prevent confidence
   - Do not rewrite CI to pass

6. **Verdict**
   - **Must-fix:** a failed Done when item, a failed Security & side effects item, a wrong base, or a regression. For validation tooling (capture, scan, verify scripts), a should-fix that could hide a failure (silent fallback, false negative, exit 0 on error) is a must-fix.
   - **PASS** = `fixes issue` with zero must-fix. Any must-fix = **FAIL**, even if every Done when box is ticked.
   - `fixes issue` — every Done when item passes with your own evidence
   - `partial` — some items pass; list gaps
   - `does not fix` — Goal unmet or critical Done when failed

7. **Comment on the PR** (required). Write the comment to a file outside the repo and post it with `bun run gh-post -- pr comment <pr> --body-file <file>`, never bare `gh` (hardened-coding § Security & side effects).

```markdown
## Independent verification (round <k>): PASS | FAIL
**Issue:** #<n> — <title>
**Verdict:** fixes issue | partial | does not fix. <m> must-fix, <s> should-fix.
**Verified at:** `<head sha>`, own worktree, ports <ports>. Live data: no writes | <approved exception>. Base: `dev` | wrong (`master`/`main`).

### Checks
| # | Check | Result | Evidence (my own runs) |
| --- | --- | --- | --- |
| 1 | Scope (`git diff --name-only`) | PASS / FAIL | ... |
| 2 | typecheck / test / lint / build | ... | exit codes and counts |
| 3 | Security & side effects | ... | scan counts, CI triggered, Vercel check |
| 4… | One row per Done when item, claim or prior finding | ... | ... |

### Done when
- [x] or [ ] <item> — evidence: check #<k>

### Must-fix
- None | 1. <finding, repro, suggested fix>

### Should-fix
- None | 1. ...

### Nits
- None | ...

### Artifacts
- Screenshots/recordings with raw URLs (or N/A), and where your media was published.
```

8. **Hand back**
   - Never edit or push to the PR. Report every gap as a must-fix or should-fix. The builder fixes it, and the coordinator then starts a new verification round.

## Automation prompt

```text
Use pr-issue-verify.
Follow docs/agent-os.md.
PR: from event context (or #<pr>).
Resolve linked issue via Fixes/Closes #N.
Confirm base branch is `dev` (flag master/main as blocker).
Post the Independent verification comment on the PR with `bun run gh-post -- pr comment <pr> --body-file <file>`.
Do not merge.
Never edit or push to the PR; report every gap as must-fix or should-fix for the builder.
For UI: repro with correct auth/viewport and attach screenshot/recording evidence.
Model policy: prefer single-agent work; if sub-agents are required use composer-2.5 only; never Sonnet/Opus.
```

## Forbidden

- Merging without explicit ask
- Verifying a PR you built, or editing the PR you are verifying
- Approving “fixes issue” without your own evidence per Done when item
- Ignoring wrong base branch (`master`/`main` instead of `dev`)
- Ignoring Out of scope drive-by changes
- Filing a new issue instead of reviewing (unless you discover a separate bug — then use create-task and still complete this review)
