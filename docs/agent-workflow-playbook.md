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
2. **Header slots are fixed** — left context / center search / right actions ([floating-header-islands.md](./floating-header-islands.md)).
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
Be placement-nitpicky against floating-header-islands and neighbor top-bars.
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
