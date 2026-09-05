---
name: project-context-gate
description: >-
  Mandatory investigate-first gate before editing this repo. Builds a Context
  Brief from docs and nearest existing UI/code patterns so changes match
  product structure, shell placement, and styling. Use before any coding loop,
  UI change, Convex change, or when the user mentions pattern drift, wrong
  button placement, or inconsistent UI.
---

# Project context gate

Canonical ritual: `docs/agent-workflow-playbook.md`.

No application edits until the Context Brief below is written in the chat.

## Hard rules

1. Do not edit `src/`, `convex/`, or styles until the Context Brief is complete.
2. Prefer matching an existing neighbor over inventing a new pattern.
3. If docs and code disagree, follow the nearest production code pattern and note the mismatch.
4. If placement is ambiguous after investigation, stop and ask — do not guess.

## Phase A — Route the docs

Read `docs/README.md` and `docs/agent-workflow-playbook.md`, then read only what applies:

| Task touches | Required reads |
| --- | --- |
| Any `src/` or `convex/` edit | `docs/agent-onboarding.md` |
| Product scope / should we build it | `docs/PRODUCT_VISION.md` |
| Data flow, auth, Convex shape | `docs/SYSTEM_ANALYSIS.md` |
| UI feature structure | `docs/component-architecture-playbook.md` |
| Tokens, borders, radius, motion, labels | `docs/UI_UX_DESIGN.md` |
| Theme / chrome axes | `docs/theme-and-chrome.md` |
| Page header actions, search, back, tabs | `docs/floating-header-islands.md` (desktop inventory) and `docs/mobile-shell.md` (mobile inventory) |
| Community / tier lists | Feature doc if present; else code neighbors only — note gap |
| Teams | `docs/teams-feature-implementation.md` |

Also open `AGENTS.md` and use any listed skill that matches.

If a linked doc is missing, note it under Risks and continue from code neighbors — do not invent a parallel design system.

## Phase B — Find nearest neighbors in code

Locate 2–3 existing examples of the same job.

### UI / placement

1. Route/feature folders under `src/app` and `src/components`.
2. Page header/top-bar (desktop floating bar, mobile nav/tab-bar slots).
3. Sibling page with the same kind of control.
4. Record placement: desktop left/center/right, or mobile slots from `docs/mobile-shell.md`; inline, overflow, sheet.
5. Copy that placement unless the task explicitly changes IA.

Desktop floating roles: left = context, center = search/filter, right = actions. Mobile roles: [mobile-shell.md](../../../docs/mobile-shell.md). Empty stays empty.

Primitives: `src/components/shell/floating-page-bar.tsx`, `src/components/shell/floating-island.tsx`, `src/components/shell/mobile-nav-bar/`, `src/components/shell/mobile-tab-bar/`.

### Backend / Convex

Match neighbor query/mutation/action patterns and auth helpers (`convex/lib/deckAccess.ts`, admin auth, etc.).

### Styling

ShadCN / MagicUI / shell components + ladders in `docs/UI_UX_DESIGN.md`. No one-off visual language.

## Phase C — Write the Context Brief

```markdown
## Context Brief

### Goal
<one sentence>

### Done-When
- <observable checks>

### Docs read
- <path> — <what it constrains for this task>

### Code neighbors
- <path> — same job / placement / pattern to copy
- <path>
- <path>

### Placement plan (UI only)
- Desktop control goes: <slot or “n/a”>
- Mobile control goes: <pattern or “n/a”>
- Explicitly NOT placing it: <wrong spots rejected>

### Style plan
- Components/primitives to reuse: <list>
- Tokens/ladders to follow: <list>
- Visual changes allowed: <none | listed>

### Visual verify (UI only)
- Routes: <list>
- Viewports: desktop, mobile
- Auth/theme: <state>
- Expected change: <one sentence>
- Must not change: <list>

### Touch list
- Files likely to edit: <list>
- Files out of scope: <list>

### Risks / open questions / doc gaps
- <ambiguities or missing docs>
```

## Phase D — Proceed

Only after the brief exists: continue into `hardened-coding`, `hardened-convex-ops`, `hardened-pr-babysit`, or implement under this brief. Update the brief if evidence changes — do not silently drift.

## Anti-drift checklist

Reject plans that would relocate header roles, add desktop in-content heroes when the identity pill owns the title, restyle unlike neighbors, grow monolithic routes, bypass auth helpers, or “improve” unrelated UI.
