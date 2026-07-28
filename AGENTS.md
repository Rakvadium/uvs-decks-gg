Before implementing code, check whether any available skills apply. If one applies, use it.

## Start here

**[docs/agent-os.md](docs/agent-os.md)** — tasks, routing, workflows, triggers (the operating system).

Supporting detail:

- Queue/labels: [docs/agent-issue-queue.md](docs/agent-issue-queue.md)
- Implement ritual: [docs/agent-workflow-playbook.md](docs/agent-workflow-playbook.md)
- Onboarding/login: [docs/agent-onboarding.md](docs/agent-onboarding.md)

## Required gate

For any non-trivial change to `src/` or `convex/`, start with **`project-context-gate`**. Do not edit until a Context Brief exists.

## Workflow skills

| Skill | Purpose |
| --- | --- |
| `create-task` | File one GitHub issue (no implementation) |
| `scheduled-reviewer` | Review UI/code; file issues only |
| `project-context-gate` | Investigate-first Context Brief |
| `hardened-coding` | Implement + verify (+ visual/UI adversary) |
| `hardened-convex-ops` | Convex/ops diagnosis loop |
| `ui-ux-adversary` | Nit-picky UI review + image compare |
| `hardened-pr-babysit` | Keep a PR merge-ready |
| `backlog-worker` | Claim next `agent-ready` + `size/S` and run the right workflow |

## Implementation skills

- `vercel-composition-patterns`
- `vercel-react-best-practices`
- `web-design-guidelines`
- `frontend-design`

Use ShadCN and MagicUI for styling/components when possible.

## Docs

- Hub: [docs/README.md](docs/README.md)
- UI modules: [docs/component-architecture-playbook.md](docs/component-architecture-playbook.md)
- UI tokens: [docs/UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md)
- Header placement: [docs/floating-header-islands.md](docs/floating-header-islands.md)
