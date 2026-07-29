# Agent onboarding — tcg-decks (coding agent)

Read this before editing application code in **`src/`** or **`convex/`**.

**Agent OS (tasks → workflows):** [agent-os.md](./agent-os.md)  
**Implement ritual:** [agent-workflow-playbook.md](./agent-workflow-playbook.md)

## 0. Investigate first (mandatory)

Do not start coding from the task description alone. Run the **`project-context-gate`** skill and produce a **Context Brief** first.

Minimum investigation:

1. Read the docs that match the task (table below).
2. Find 2–3 **code neighbors** that already do the same job.
3. For UI: record where sibling pages put the same control (floating bar slot, mobile top bar, inline, overflow). Copy that placement.
4. Only then edit.

If placement or pattern is still ambiguous, ask — do not invent a new spot for buttons, search, or nav.

## 1. Required reading (short)

| Order | Doc | Why |
| --- | --- | --- |
| 1 | [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Scope and principles |
| 2 | [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) | Where data and flows live |
| 3 | [component-architecture-playbook.md](./component-architecture-playbook.md) | How to structure UI modules |
| 4 | [UI_UX_DESIGN.md](./UI_UX_DESIGN.md) | Borders, surfaces, radius, motion, labels |
| 5 | [floating-header-islands.md](./floating-header-islands.md) | Where page actions/search/tabs belong |
| 6 | [theme-and-chrome.md](./theme-and-chrome.md) | Theme/chrome axes and tokens |

If you touch community rankings or tier lists, read [features/community/TierListSystem.md](./features/community/TierListSystem.md) and prefer code neighbors under `src/components/community/`.

Feature-specific docs are listed in [README.md](./README.md).

## 2. UI placement rules (anti-drift)

Desktop floating header slots are role-fixed:

| Slot | Role | Allowed |
| --- | --- | --- |
| Left | Context | Back, identity, local tabs |
| Center | Content tool | Search/filter only |
| Right | Actions | Primary/secondary page actions |

Never relocate roles to fill an empty slot. Prefer empty over wrong.

Canonical primitives live under `src/components/shell/floating-page-bar.tsx` and `src/components/shell/floating-island.tsx`.

Mobile keeps its own path (`md:hidden` headings, shell `top-bar`, mobile sheets). Every desktop floating action needs an equivalent mobile affordance.

After UI edits, run **`ui-ux-adversary`** and clear must-fix findings before claiming done.

## 3. Repository tools

- Prefer **Bun** for installs and scripts (`bun install`, `bun run lint`, `bun run build`). See stack notes in [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) / docs hub.
- Follow [AGENTS.md](../AGENTS.md) for Cursor skills.
- Preferred closed loops: `hardened-coding`, `hardened-convex-ops`, `hardened-pr-babysit`.
- Tasks / routing / workflows: [agent-os.md](./agent-os.md) (`create-task`, `backlog-worker`, `scheduled-reviewer`).

## 4. Verification

Before you report completion:

- `bun run lint`
- `bun run build`
- If UI changed: BEFORE/AFTER snapshots (desktop + mobile), `ui-ux-adversary` with image compare, placement still matches [floating-header-islands.md](./floating-header-islands.md)

If you change Convex schema or function signatures, ensure Convex codegen and types are consistent with your local workflow.

## 5. Documentation updates

When behavior or architecture changes materially, update the smallest set of:

- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) for runtime or data-flow shifts
- Feature deep-dives where they exist (for example [teams-feature-implementation.md](./teams-feature-implementation.md))
- [CHANGELOG.md](./CHANGELOG.md) under `[Unreleased]`
- [BACKLOG.md](./BACKLOG.md) rows you reserved or completed

## 6. Local agent browser login (dev only)

Use this when a browser agent (Cursor preview, Playwright, Computer Use, etc.) needs a real signed-in session against **local `next dev`**.

1. In `.env.local` (never commit):

```bash
AGENT_AUTH_SECRET=replace-with-a-long-random-string
AGENT_AUTH_EMAIL=agent@localhost.dev
AGENT_AUTH_PASSWORD=AgentDev1
AGENT_AUTH_USERNAME=agent
```

Password must be at least 8 characters and include a number (same rules as normal signup).

2. Run the app with `bun run dev` (port **8090**).

3. Open:

```text
http://localhost:8090/agent-login?token=YOUR_AGENT_AUTH_SECRET
```

Optional: `&next=/gallery` (relative paths only).

The page calls `POST /api/agent-auth`, signs in with Convex password auth, and creates the agent user on first use. The route is **disabled** unless `NODE_ENV=development` and `VERCEL` is not `1`. Do not set these env vars on Vercel or production hosts.

## 7. What not to do

- Do not edit before a Context Brief from `project-context-gate`.
- Do not invent button/search/nav placement that sibling pages do not use.
- Do not grow monolithic route components when a **feature folder** would match the playbook.
- Do not bypass auth checks in Convex writes.
- Do not treat `_reference/docs/` as the product specification for tcg-decks.
- Do not enable agent login outside local development.
- Do not drive-by restyle unrelated surfaces while fixing a task.
