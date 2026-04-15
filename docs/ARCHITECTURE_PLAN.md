# Architecture plan — tcg-decks

Links **product intent** to **repository habits**: where code should live, how large files should split, and which document is authoritative for each concern.

## Authority map


| Topic                  | Canonical doc                                                              |
| ---------------------- | -------------------------------------------------------------------------- |
| Outcomes and scope     | [PRODUCT_VISION.md](./PRODUCT_VISION.md)                                   |
| Runtime and subsystems | [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)                                 |
| UI module shape        | [component-architecture-playbook.md](./component-architecture-playbook.md) |
| File size discipline   | [CODE_SIZE_POLICY.md](./CODE_SIZE_POLICY.md)                               |
| Queued work            | [BACKLOG.md](./BACKLOG.md)                                                 |
| Release notes          | [CHANGELOG.md](./CHANGELOG.md)                                             |


## Stack posture

- **Application:** Next.js App Router in `src/app/`, shared UI in `src/components/`, client utilities in `src/lib/`.
- **Backend:** Convex in `convex/` with schema in `convex/schema.ts` and feature modules alongside.
- **Auth:** Convex Auth patterns; identity available in Convex functions per `@convex-dev/auth` usage in this repo.

## Vision ↔ code (high level)


| Vision area          | Typical location                                                                |
| -------------------- | ------------------------------------------------------------------------------- |
| Deck editing         | `src/app/(app)/decks/`, `src/components/decks/`                                 |
| Gallery              | `src/app/(app)/gallery/`, card search hooks and Convex card queries             |
| Collection           | `src/app/(app)/collection/`, Convex `collections` table                         |
| Community tier lists | `src/app/(app)/community/`, Convex `tierLists`, `tierListItems`, ranking tables |
| Admin import         | `src/app/(app)/admin/`, scripts under `scripts/`                                |
| Shared shell         | `src/components/shell/`                                                         |


When a route or component grows hard to navigate, refactor toward the **feature folder** pattern in the playbook rather than adding parallel ad hoc folders.

## Component architecture (required reading)

All non-trivial UI work should align with **[component-architecture-playbook.md](./component-architecture-playbook.md)**:

- Stable **wrapper** at the historical import path re-exporting `content.tsx`.
- `**hook.ts`** for orchestration, derived state, and side effects.
- `**context.tsx**` when multiple descendants share one model without prop drilling.
- **Small presentational** siblings (`header.tsx`, `list.tsx`, …) instead of one oversized file.

## File size and Convex modules

- Target and enforcement: [CODE_SIZE_POLICY.md](./CODE_SIZE_POLICY.md).
- For Convex, prefer **splitting by concern** (queries vs mutations vs helpers) while keeping **public `api.*` paths** stable within a single change set.

## Documentation tree

This repository keeps a fuller **example** tree under `**_reference/docs/`**. Treat it as a **structural reference**, not as the product spec for tcg-decks. `**docs/`** here is canonical.

## See also

- [AGENT_WORKFLOWS.md](./AGENT_WORKFLOWS.md)
- [agent-onboarding.md](./agent-onboarding.md)