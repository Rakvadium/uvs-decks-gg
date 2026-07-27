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

## Cursor Cloud specific instructions

### Tech stack
- Package manager: Bun (`bun.lock`). Use `bun install`, `bun run <script>`, `bun test`.
- Frontend: Next.js 16 (App Router) on port **8090**.
- Backend: Convex (cloud-hosted — no local DB). Use `CONVEX_AGENT_MODE=anonymous` for cloud agents so they do not collide with personal Convex deployments.
- Auth: `@convex-dev/auth` (email/password + Resend OTP for password reset).

### Running services
| Service | Command | Notes |
|---------|---------|-------|
| Next.js dev server | `bun run dev` | Port 8090. Needs `NEXT_PUBLIC_CONVEX_URL`. |
| Convex backend | `CONVEX_AGENT_MODE=anonymous npx convex dev` | Syncs `convex/` to an isolated anonymous deployment. |

### Required secrets / env vars
Set these in the Cloud Agents Secrets tab (do not commit):
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL (required for the React client).
- Optional: `CONVEX_DEPLOY_KEY`, auth/Resend keys, R2 credentials, and `AGENT_AUTH_SECRET` for `/agent-login` when testing authenticated UI.

### Key commands
- Lint: `bun run lint`
- Test: `bun run test`
- Build: `bun run build` (`next build --webpack`)
- Typecheck: `bun run typecheck`
- Dev: `bun run dev` (port 8090)

### Gotchas
- Prefer Bun; do not use npm/pnpm/yarn.
- `shadcn-reference/` is excluded from lint/TS (reference snippets only).
- App redirects `/` to `/gallery` via middleware.
- Cloud env install/startup is defined in `.cursor/environment.json`.
