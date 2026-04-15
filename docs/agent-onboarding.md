# Agent onboarding — tcg-decks (coding agent)

Read this before editing application code in **`src/`** or **`convex/`**.

## 1. Required reading (short)

| Order | Doc | Why |
| --- | --- | --- |
| 1 | [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Scope and principles |
| 2 | [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) | Where data and flows live |
| 3 | [component-architecture-playbook.md](./component-architecture-playbook.md) | How to structure UI modules |
| 4 | [CODE_SIZE_POLICY.md](./CODE_SIZE_POLICY.md) | When and how to split files |

If you touch community rankings or tier lists, also read [community-tier-list-system.md](./community-tier-list-system.md).

## 2. Repository tools

- Prefer **Bun** for installs and scripts (`bun install`, `bun run lint`, `bun run build`). See [TECH_STACK_DETAILS.md](./TECH_STACK_DETAILS.md).
- Follow [AGENTS.md](../AGENTS.md) for Cursor skills applicable to the task.

## 3. Verification

Before you report completion:

- `bun run lint`
- `bun run build`

If you change Convex schema or function signatures, ensure Convex codegen and types are consistent with your local workflow.

## 4. Documentation updates

When behavior or architecture changes materially, update the smallest set of:

- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) for runtime or data-flow shifts
- Feature deep-dives (for example [community-tier-list-system.md](./community-tier-list-system.md))
- [CHANGELOG.md](./CHANGELOG.md) under `[Unreleased]`
- [BACKLOG.md](./BACKLOG.md) rows you reserved or completed

## 5. What not to do

- Do not grow monolithic route components when a **feature folder** would match the playbook.
- Do not bypass auth checks in Convex writes.
- Do not treat `_reference/docs/` as the product specification for tcg-decks.
