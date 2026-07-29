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
| `hardened-pr-babysit` | Keep a PR merge-ready (CI/conflicts/comments) |
| `pr-issue-verify` | Verify a PR completes its linked issue’s Done when |
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
- UI tokens/patterns: [docs/UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md)
- Header/action placement: [docs/floating-header-islands.md](docs/floating-header-islands.md)

## Cursor Cloud specific instructions

Stack: Next.js 16 (App Router, React 19) + Convex backend, **Bun** as package manager/runner. The update script runs `bun install`; the notes below are for starting/running services (not covered by the update script).

Two dev services (no combined script — run each in its own tmux session):
- Convex backend: `bunx convex dev` (keeps functions/codegen synced with the cloud dev deployment). Standard command per Convex; started manually, not in `package.json` scripts.
- Next.js frontend: `bun run dev` → serves on **http://localhost:8090** (port is hardcoded).

Convex deployment + secrets (already provisioned; do not re-provision):
- The Cloud env injects `CONVEX_DEPLOY_KEY`, `CONVEX_URL`, and `NEXT_PUBLIC_CONVEX_URL` as secrets, so Convex CLI targets a real cloud **dev** deployment and Next.js can reach it even before `.env.local` exists. `bunx convex dev` (re)writes `.env.local` with the matching `CONVEX_DEPLOYMENT`/`NEXT_PUBLIC_CONVEX_URL`.
- That deployment already has its env vars set (`JWKS`, `JWT_PRIVATE_KEY` for Convex Auth, plus `R2_*`, `OPENAI_API_KEY`, `YOUTUBE_DATA_API_KEY`, `ADMIN_API_KEY`, `AUTH_RESEND_KEY`). Inspect with `bunx convex env list`. Auth works out of the box — no `@convex-dev/auth` init needed.
- This is a **shared** cloud dev deployment; `bunx convex dev` deploys your local function changes to it, so schema/function edits are visible to anyone else on it.

Authenticated testing via agent login (dev only; see [docs/agent-onboarding.md](docs/agent-onboarding.md) §6):
- `AGENT_AUTH_SECRET` / `AGENT_AUTH_EMAIL` / `AGENT_AUTH_PASSWORD` / `AGENT_AUTH_USERNAME` are injected as secrets, so the `/agent-login` flow works without extra setup. Visit `http://localhost:8090/agent-login?token=$AGENT_AUTH_SECRET&next=/decks` in a browser to auto sign in as the `agent` user (created on first use). The sign-in completes client-side via Convex Auth, so it must run in a real browser, not curl.
- Only active when `NODE_ENV=development` and `VERCEL!=1` (both true under `bun run dev`).

Verification (per [docs/agent-onboarding.md](docs/agent-onboarding.md) §4 and `.github/workflows/ci.yml`): `bun run typecheck`, `bun test`, `bun run lint`. Note: `bun run lint` currently reports pre-existing errors in `src/providers/universus-media-dock/dock.tsx` (set-state-in-effect) unrelated to environment setup.
