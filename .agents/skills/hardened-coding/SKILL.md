---
name: hardened-coding
description: >-
  Closed-loop coding workflow with investigate-first Context Brief, adversarial
  review, visual before/after when UI changes, and verification. Use when
  implementing features/bugfixes in this repo, when the user asks for a hardened
  coding loop, or when prior agent passes drifted UI/style.
---

# Hardened coding loop

Canonical ritual: `docs/agent-workflow-playbook.md`.

## Phase 0 — Context gate (mandatory)

Run `project-context-gate` first. Produce a Context Brief. No edits before that.

If UI is in scope:

- Brief must include Placement plan + Visual verify section
- Capture BEFORE snapshots (desktop + mobile) on listed routes after auth/setup, before edits

## Roles

1. Implementer — smallest slice toward Done-When  
2. Adversary — diff + Done-When + Context Brief only; assumes wrong  
3. Fixer — valid adversary findings only  
4. Verifier — same objective check again  

## Queue

- baseline repro / missing behavior  
- acceptance checks  
- UI adversary + visual compare if UI files change  

## Loop

1. Claim one queue item in the touch list.  
2. Implementer: smallest change; match neighbors; no drive-by restyles.  
3. Adversary: regressions, placement/style drift vs brief + `docs/UI_UX_DESIGN.md`, auth/schema risks, stubs/fake-green/scope creep.  
4. Fixer applies valid findings.  
5. Verifier: `bun run lint` && `bun run build` (+ targeted check).  
6. Update queue with evidence.  

## UI completion gate

If any UI file changed:

1. Capture AFTER snapshots (same routes/viewports/states as BEFORE).  
2. Run `ui-ux-adversary` on diff/routes; adversary must compare BEFORE vs AFTER when images exist.  
3. Clear must-fix findings before claiming done.  
4. Confirm placement still matches Context Brief / floating-header inventory.
5. If opening a PR: run `capture:compare` + `capture:publish` (`scripts/pr-capture/README.md`) and embed the generated `summary.md` (Before **and** After, raw `pr-media` URLs). Never use `cursor.com/artifacts` in the PR body (they expire; GitHub usually shows only Before). See `docs/agent-workflow-playbook.md` § PR visual embeds.  

## Security & side effects

Rules: `AGENTS.md` § Secrets and live data. This is the one checklist for both roles. Builders run every item before opening or updating a PR and put the results in the PR body. Verifiers rerun every item themselves through `pr-issue-verify`.

- [ ] **Secret scan:** the values come from the main checkout's live env backup (`.env.local.live-backup`) and its Convex env dump (`data/live-env-no-r2.txt`). A worktree has neither, so pass both by full path (`<main>` = the main checkout):
  - `bun run secret-scan --strict --diff origin/<base>..HEAD --env-file <main>/.env.local.live-backup --env-file <main>/data/live-env-no-r2.txt` scans the PR's own commits (merge-base to HEAD), not a two-way diff against the base.
  - `bun run secret-scan --strict --path <dir>` with the same two `--env-file` flags, for every capture or media folder before it is published.
  - Optional before each commit: `bun run secret-scan --strict --staged` with the same flags.
  - A non-zero exit fails this item. That includes `secret-scan: missing required value(s): …`. `CONVEX_DEPLOY_KEY` (optional) and `SECRET_SCAN_CANARY` (CI only) are expected to be absent locally and don't fail it.
  - No main checkout or env files (e.g. cloud agents): the local scan can't run. The CI `secret-scan` job is the gate, and the PR doesn't merge until it passes.
  - Until `secret-scan` is available (#202), run the fallback scan below.
- [ ] **Live data:** no writes, and no `convex` command that changes the cloud deployment without human approval. Say so in the PR body.
- [ ] **Scope:** every path in `git diff --name-only origin/<base>...HEAD` is in the issue's allowed paths.
- [ ] **New targets:** for each new branch, push target, upload or workflow, name the CI/CD it triggers (Vercel, GitHub Actions) and who can see it (this repo is public). Example: the orphan `pr-media` branch triggered failed Vercel builds until it got a `vercel.json` with deployments disabled.
- [ ] **Preview:** the PR's own Vercel check passes (`gh pr checks <pr>`).
- [ ] **Validation tooling** (capture, scan, verify scripts): env var name patterns accept digits (`[A-Z0-9_]`, so `R2_*` matches), and every failure path is loud (non-zero exit or a flagged result).

**Fallback scan** (until `secret-scan` is available):

- **Inputs:** the added lines of `git diff origin/<base>...HEAD` (three dots, so only the PR's changes), the added lines of each commit in `git log -p origin/<base>..HEAD` (catches a value added and later removed), the commit messages from `git log origin/<base>..HEAD --format=%B`, the PR title and body, and each media folder.
- **Names:** only the required, non-`ciOnly` names in `scripts/secret-scan/secrets.json`. Until #205 merges, read it with `git show origin/agent/202-secret-scan:scripts/secret-scan/secrets.json`. Config values in the env files (bucket, URLs, deployment name) are not secrets and stay out of the scan.
- **Values:** read those names from the same two files as the scan command, `<main>/.env.local.live-backup` and `<main>/data/live-env-no-r2.txt`, by full path. If a file is missing or a required name has no value, this item fails. Skip values shorter than 8 characters.
- **Forms:** match each value raw, URL-encoded and base64-encoded.
- **Output:** print each variable name with its hit count, never the value.

## Forbidden

Editing before Context Brief; inventing placement; destructive git; skipping/weakening tests or CI; stubbing to pass; unrelated refactors; committing unless asked.

## Stop / escalate

Stop when Done-When true, verifier green, Security & side effects all checked, UI adversary clean of must-fix (if UI), visual compare done (if UI).

Escalate when blocked twice on the same failure, placement ambiguous, or product/auth decision required.
