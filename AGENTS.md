Before implementing code, check whether any available skills apply. If one applies, use it.

## Start here

**[docs/agent-workflow-playbook.md](docs/agent-workflow-playbook.md)** — converged ritual, paste prompts, visual verify, doc gaps.

## Required gate

For any non-trivial change to `src/` or `convex/`, start with **`project-context-gate`**. Do not edit until a Context Brief exists (docs read, code neighbors, UI placement + visual verify plan when UI is touched).

## Workflow skills

| Skill | Use when |
| --- | --- |
| `project-context-gate` | Before coding; prevents pattern/UI drift |
| `hardened-coding` | Feature/bugfix closed loop (+ visual before/after for UI) |
| `hardened-convex-ops` | Convex/logs/schema/data diagnosis loop |
| `hardened-pr-babysit` | Keep a PR merge-ready |
| `ui-ux-adversary` | After UI changes; nit-picky review + image compare |
| `backlog-worker` | Claim next `agent-ready` + `size/S` GitHub issue and run the ritual |

Issue queue: [docs/agent-issue-queue.md](docs/agent-issue-queue.md)

## Implementation skills

- `vercel-composition-patterns`
- `vercel-react-best-practices`
- `web-design-guidelines`
- `frontend-design`

Use ShadCN and MagicUI for styling/components when possible.

## Docs

- Hub: [docs/README.md](docs/README.md)
- Workflow playbook: [docs/agent-workflow-playbook.md](docs/agent-workflow-playbook.md)
- Agent onboarding: [docs/agent-onboarding.md](docs/agent-onboarding.md)
- UI modules: [docs/component-architecture-playbook.md](docs/component-architecture-playbook.md)
- UI tokens/patterns: [docs/UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md)
- Header/action placement: [docs/floating-header-islands.md](docs/floating-header-islands.md)
