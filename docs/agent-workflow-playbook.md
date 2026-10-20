# Agent workflow playbook

Implement/verify ritual for hardened loops. **Operating system (tasks → routing → workflows):** [agent-os.md](./agent-os.md).

**Skills (canonical):** `.agents/skills/` (mirrored in `.cursor/skills/`)  
**Onboarding / login:** [agent-onboarding.md](./agent-onboarding.md)  
**Skill index:** [AGENTS.md](../AGENTS.md)

---

## Default ritual (every non-trivial change)

```text
1. project-context-gate  → Context Brief (no edits before this)
2. BEFORE visual capture → if UI in scope (see Visual verify)
3. hardened-coding       → smallest slices + adversarial review + lint/build
4. ui-ux-adversary       → if UI touched (includes image compare when captures exist)
5. AFTER visual capture  → same routes/viewports/states as BEFORE
6. Stop                  → Done-When true, no must-fix, brief fidelity held
```

Other modes:

| Mode | Skill | When |
| --- | --- | --- |
| Convex/ops | `hardened-convex-ops` | Failures, schema/data, deploy health |
| PR babysit | `hardened-pr-babysit` | Keep a PR merge-ready |
| Queue worker | `backlog-worker` | Pull next `agent-ready` + `size/S` issue |
| Create task | `create-task` | File one issue (no implementation) |
| Review → queue | `scheduled-reviewer` | File review findings as issues only |

OS / queue: [agent-os.md](./agent-os.md) · [agent-issue-queue.md](./agent-issue-queue.md)

Never freestyle a parallel process. Same ritual → semi-predictable outcomes.

---

## Anti-drift laws

1. **Neighbors beat novelty** — copy 2–3 existing examples of the same job.
2. **Header slots are fixed** — desktop left context / center search / right actions ([floating-header-islands.md](./floating-header-islands.md)); mobile nav + tab-bar slots ([mobile-shell.md](./mobile-shell.md)).
3. **Tokens over taste** — [theme-chrome-guidelines.md](./theme-chrome-guidelines.md), [UI_UX_DESIGN.md](./UI_UX_DESIGN.md), [theme-and-chrome.md](./theme-and-chrome.md), ShadCN/MagicUI, shell primitives.
4. **Vision is a veto** — [PRODUCT_VISION.md](./PRODUCT_VISION.md); do not make a surface look like a different product.
5. **No drive-by polish** — only touch the brief’s file list.
6. **Ambiguity → ask** — do not guess placement.

---

## Context Brief (minimum)

Agents must paste a filled brief before edits. Template lives in `project-context-gate`. For UI tasks also include:

```markdown
### Visual verify
- Routes: <e.g. /decks, /gallery>
- Viewports: desktop (default), mobile (iphone-12-pro or equivalent)
- Auth/theme: <signed-in via agent-login | guest>, chrome/theme unchanged unless tasked
- Expected change: <one sentence>
- Must not change: <placement/density/slots that must stay put>
```

---

## Visual verify gate (UI tasks)

Use browser preview snapshots (and short recordings only for interaction-heavy work).

**Before edits**

1. App running (`bun run dev`, port **8090**).
2. Sign in via agent-login if the route needs auth ([agent-onboarding.md](./agent-onboarding.md) §6).
3. Snapshot BEFORE on each affected route: desktop + mobile.
4. Same theme/chrome/auth state you will use for AFTER.

**After edits**

1. Hard-refresh affected routes.
2. Snapshot AFTER with the same routes/viewports/states.
3. `ui-ux-adversary` compares BEFORE vs AFTER images:
   - intended diffs
   - unintended diffs (must-fix)
4. Optional: one short recording for dialogs, drag, sheets, hover flows.

**Do not** claim UI done from code review alone when snapshots were possible.

### PR visual embeds (GitHub)

Use the repo tool in [`scripts/pr-capture/`](../scripts/pr-capture/README.md). It writes stills, GIFs and diffs locally, then publishes them to the orphan `pr-media` branch. The PR body embeds them with raw GitHub URLs (the repo is public). Do not commit captures to the PR branch, and do not link `cursor.com/artifacts` or chat attachments. Those links expire, and GitHub usually keeps only the first image.

For UI PRs, use your own `--port` so you never collide with other agents:

1. Before editing: `bun run capture --issue <n> --label before --port <port> --routes <routes>`. Add `--themes` if theme matters, and `--spec` plus `--gif` for an interaction.
2. After the change: the same command with `--label after`.
3. `bun run capture:compare --issue <n> --base before --head after`
4. `bun run capture:publish --issue <n>`
5. Paste `.pr-captures/<n>/compare-before-vs-after/summary.md` into the PR body. It holds Before, After, side-by-side, diff and diff % for every shot, plus any GIFs. A Before-only description is incomplete.

Captures never write to Convex, and they set theme and mode in the browser only. See the README for how, and for how a verifier re-captures and diffs someone else's PR.

---

## Coordinator brief templates

A coordinator hands one issue to a builder agent, then the PR to a different verifier agent, and repeats verify rounds until one passes. Fill every `<placeholder>` and delete lines that don't apply. Reference runs: #196 and #198 (capture tooling, two verification rounds each), #201 (design foundation).

Both briefs rely on these setup rules:

- **One agent, one worktree, one port range.** Concurrent dev servers never share a checkout: Next allows one `next dev` per checkout (`.next/dev/lock`). Builder and verifier get different ranges, and both stay off the default port 8090.
- **Choose the worktree's env on purpose.** A new worktree has no `.env.local`, and the main checkout's copy may point at a local Convex instead of the cloud deployment. The brief names the target (`cloud` or `local`). Copy the main `.env.local` only after checking that its `NEXT_PUBLIC_CONVEX_URL` host matches that target, without printing the value (for example, `grep -c` for the local host).

### Builder brief

```text
You are the BUILDER for issue #<n> (`gh issue view <n>`). A separate agent will verify your PR.

Setup
1. `git fetch origin && git checkout -B agent/<n>-<slug> origin/dev` in your own worktree.
2. Ports <first>–<last> only. Convex target: <cloud | local | none>; set up env per docs/agent-workflow-playbook.md § Coordinator brief templates.
3. Allowed files: <globs>. Other agents are editing <globs>.

Bans
- AGENTS.md § Secrets and live data. Approved exceptions: <none | command + reason>.
- Push only to your PR branch<, and to pr-media for captures>. Don't merge.

Process
- Read the issue, AGENTS.md and every file you'll edit. project-context-gate, then hardened-coding.
- Implement each Done when item. <Issue-specific constraints or lessons.>

Checks
- `bun run typecheck`, `bun test`, `bun run lint`, `bun run build`.
- Every item in hardened-coding § Security & side effects.
- UI: before/after captures on your ports (§ PR visual embeds).

Output
- `gh pr create --base dev` with `Fixes #<n>`, evidence per Done when item, and the security checklist results.
- Final report (short): PR URL, Done when → evidence, anything uncertain.
```

### Verifier brief

```text
You are the VERIFIER for PR #<pr> (issue #<n>), round <k>. You did not build it.

Setup
1. Your own worktree at the PR head (`gh pr checkout <pr>`). Record the head SHA.
2. Ports <first>–<last>, different from the builder's. Convex target: <same as builder>; same env rule.

Bans
- AGENTS.md § Secrets and live data. Approved exceptions: <none | command + reason>.
- No pushes to the PR branch. Publish your media only under `<n>/verify*` labels. Don't merge.

Process
- Use pr-issue-verify. Reproduce every PR-body claim with your own runs and captures.
- <Round 2+: re-check each prior must-fix and should-fix by number, then rerun the full check table.>
- <Issue-specific probes, e.g. break the tool and confirm it fails loudly.>

Checks
- Each Done when item, typecheck/test/lint/build, and every item in pr-issue-verify § Security & side effects.

Output
- One PR comment in the pr-issue-verify format (check table, evidence, must-fix, should-fix, nits). Verdict rules: pr-issue-verify § Verdict.
- Stop your dev servers and confirm your ports are free.
- Final report (short): comment URL, verdict, must-fix list.
```

---

## Paste prompts for testing

### A) Full coding loop (recommended first test)

```text
Follow docs/agent-workflow-playbook.md exactly.

Use project-context-gate, then hardened-coding.

Goal: <ONE SENTENCE TASK>

Rules:
- No edits until Context Brief is pasted
- Match neighbors; no drive-by restyles
- If UI: BEFORE snapshots → implement → AFTER snapshots → ui-ux-adversary with image compare
- bun run lint && bun run build before done
- Do not commit unless I ask
- If placement is ambiguous, stop and ask
```

### B) UI-only adversary on an existing diff

```text
Use ui-ux-adversary on the current diff for routes: <ROUTES>.
Follow docs/agent-workflow-playbook.md visual verify if BEFORE/AFTER captures exist.
Be placement-nitpicky against floating-header-islands, mobile-shell, and neighbor chrome.
Do not implement until I say apply UI fixes.
```

### C) Convex ops

```text
Follow docs/agent-workflow-playbook.md.
Use project-context-gate, then hardened-convex-ops.
Symptom: <…>
Environment: <dev | prod | unknown>
Dev first. No prod mutations without approval.
```

### D) PR babysit

```text
Follow docs/agent-workflow-playbook.md.
Use hardened-pr-babysit on PR #<n>.
If UI files change, run ui-ux-adversary (+ visual verify when possible).
Do not merge unless I ask.
```

### E) Backlog worker (issue queue)

```text
Use backlog-worker.
Follow docs/agent-os.md.
Cap: 1 issue.
Open a PR into base `dev` (not master/main) with Fixes #N when done (unless I say not to commit).
```

### F) Create task / scheduled review

See paste prompts in [agent-os.md](./agent-os.md).

---

## Suggested first experiments

Start small so you can judge drift control:

1. **Tiny UI copy/spacing tweak** on one known page (e.g. decks list empty state) — expect Context Brief + before/after + no slot invention.
2. **Add a secondary action** to a page that already has a right-slot action — expect it to land in the right slot / overflow, not center/content.
3. **Convex-only validation message** — expect no UI restyle; brief marks placement n/a.

After each run, grade the agent:

| Check | Pass? |
| --- | --- |
| Brief before edits | |
| Neighbors cited | |
| Placement matched siblings / header inventory | |
| No unrelated visual changes | |
| Lint/build run | |
| UI adversary run (if UI) | |
| BEFORE/AFTER compared (if UI) | |

---

## Documentation gaps (build later)

Noted while converging this playbook. Not blockers for starting loop tests; fill as pain appears.

| Gap | Why it matters | Suggested artifact |
| --- | --- | --- |
| Broken links in [README.md](./README.md) | Agents may chase missing files | Restore or remove remaining gaps: `card-data-hooks.md`, `content-moderation-and-language-filter.md`, `CODE_REVIEW_2026-07-23.md` (tier lists restored at [features/community/TierListSystem.md](./features/community/TierListSystem.md)) |
| No gallery / deck-editor UX deep-dive | Highest-churn UI; placement inventory helps but interaction patterns live only in code | `docs/gallery-and-deck-editor-ux.md` (controls, sidebars, symbol/character pickers) |
| No aesthetic “do not drift” examples | Vision doc is principles-only; agents lack visual do/don’t | Short section in `UI_UX_DESIGN.md` or `PRODUCT_VISION.md` with 3–5 anti-patterns |
| No golden Context Brief example | Agents improvise brief quality | `docs/examples/context-brief.example.md` from a real task |
| Multi-step flow recipes deferred | Long paths (create deck → add/remove card → symbol → character) aren’t capturable by one screenshot | `docs/agent-flows/*` when ready |
| Missing `CODE_SIZE_POLICY.md` (historically referenced) | File-size / split guidance unclear | Restore policy or point only at playbook |
| Admin / import UX undocumented for agents | Easy to invent admin layouts | Thin admin shell/placement note |
| Automated E2E not required yet | Manual browser verify is the current bar | Promote stable recipes to Playwright later |

When a loop fails because context was missing, add a row here (or flesh the suggested artifact) before inventing more process.
