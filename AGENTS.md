Before implementing code, check whether any available skills apply. If one applies, use it.

## Start here

**[docs/agent-os.md](docs/agent-os.md)** — tasks, routing, workflows, triggers (the operating system).

Supporting detail:

- Queue/labels: [docs/agent-issue-queue.md](docs/agent-issue-queue.md)
- Implement ritual: [docs/agent-workflow-playbook.md](docs/agent-workflow-playbook.md)
- Onboarding/login: [docs/agent-onboarding.md](docs/agent-onboarding.md)

## Required gate

For any non-trivial change to `src/` or `convex/`, start with **`project-context-gate`**. Do not edit until a Context Brief exists.

## Secrets and live data

The cloud Convex deployment (the one Convex calls "dev") serves the live site. A write or deploy there is a production change. Data in a local backend (`127.0.0.1`/`localhost`) is yours to write. Convex CLI commands follow the rules below either way.

- Write env var **names**, never values, in tracked files, commit messages, PR text, comments and published media. Docs and tests use `<placeholder>` values.
- Keep secrets out of URLs and logs. The one exception is `/agent-login?token=` on `http://localhost:<port>` under `next dev` (the route only works when `NODE_ENV=development` and `VERCEL!=1`). Open it only in your own browser. `next dev` output logs that URL with the token, so redact `token=` before you share dev-server output.
- Leave live data as you found it: read only. Signing in as the agent user (its own auth session) is the only write allowed.
- Convex commands:
  - **Read only, allowed:** only `convex logs`, `convex function-spec`, and env var names through this filter. In bash (Git Bash on Windows), from the checkout root, it prints names the repo already uses, plus a count of other entries:

    ```bash
    known="$(grep -rhoE 'process\.env\.[A-Z][A-Z0-9_]*' convex | cut -d. -f3 | sort -u | paste -sd'|')|JWKS|JWT_PRIVATE_KEY|SITE_URL|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_ENDPOINT|R2_BUCKET"
    bunx convex env list | awk -F= -v k="^($known)\$" '/^[A-Z][A-Z0-9_]*=/ { if ($1 ~ k) print $1; else n++ } END { print (n+0) " other NAME= lines (not printed)" }'
    ```

    Against the cloud deployment, never run `env get` or an unfiltered `env list`, and never redirect their output to a file. `bun run vconvex -- env get` on a local validation backend is fine.
  - **Every other `convex` command is a write.** That includes `export` (downloads every table), `data` (prints live rows), `mcp start`, `integration`, and any Convex MCP server pointed at the cloud deployment.
  - **Always need explicit human approval of the exact command:** `convex deploy` (it always targets a cloud deployment, prod by default), and any command with `--prod`, `--url`, `--deployment-name`, `--env-file`, `--admin-key` or `--preview-*`.
  - **All other writes** (`dev`, `run`, `import`, `env set`, `env remove`, migrations, and the commands above): once #210 merges, run them only through `bun run vconvex -- …` against a local backend. First run `bun run vconvex -- --check`. It prints only the resolved target class (`local`/`cloud`/`unknown`) and which guard rules passed. Until #210 merges there is no self-check, so every Convex write or deploy needs explicit human approval of the exact command.

Per-PR checklist: `hardened-coding` § Security & side effects. Verifiers rerun it through `pr-issue-verify`.

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
- Header/action placement: [docs/floating-header-islands.md](docs/floating-header-islands.md) (desktop), [docs/mobile-shell.md](docs/mobile-shell.md) (mobile)

## Cursor Cloud specific instructions

Stack: Next.js 16 (App Router, React 19) + Convex backend, **Bun** as package manager/runner. The update script runs `bun install`; the notes below are for starting/running services (not covered by the update script).

Two dev services (no combined script — run each in its own tmux session):
- Convex backend: never raw `bunx convex dev`, which syncs functions to the cloud deployment. Follow the Convex command rules in Secrets and live data: `bun run vconvex -- dev` against a local backend once #210 merges, and explicit human approval of the exact command until then.
- Next.js frontend: `bun run dev` → serves on **http://localhost:8090** (port is hardcoded).

Convex deployment + secrets (already provisioned; do not re-provision):
- The Cloud env injects `CONVEX_DEPLOY_KEY`, `CONVEX_URL`, and `NEXT_PUBLIC_CONVEX_URL` as secrets, so Convex CLI targets a real cloud **dev** deployment and Next.js can reach it even before `.env.local` exists. `bunx convex dev` (re)writes `.env.local` with the matching `CONVEX_DEPLOYMENT`/`NEXT_PUBLIC_CONVEX_URL`.
- That deployment already has its env vars set (`JWKS`, `JWT_PRIVATE_KEY` for Convex Auth, plus `R2_*`, `OPENAI_API_KEY`, `YOUTUBE_DATA_API_KEY`, `ADMIN_API_KEY`, `AUTH_RESEND_KEY`). `bunx convex env list` prints values. List names only with the filter in Secrets and live data. Auth works out of the box — no `@convex-dev/auth` init needed.
- This is a **shared** cloud dev deployment, and it serves the live site (see Secrets and live data). `bunx convex dev` deploys your local function changes to it, so schema/function edits go live.

Authenticated testing via agent login (dev only; see [docs/agent-onboarding.md](docs/agent-onboarding.md) §6):
- `AGENT_AUTH_SECRET` / `AGENT_AUTH_EMAIL` / `AGENT_AUTH_PASSWORD` / `AGENT_AUTH_USERNAME` are injected as secrets, so the `/agent-login` flow works without extra setup. Visit `http://localhost:8090/agent-login?token=$AGENT_AUTH_SECRET&next=/decks` in a browser to auto sign in as the `agent` user (created on first use). The sign-in completes client-side via Convex Auth, so it must run in a real browser, not curl.
- Only active when `NODE_ENV=development` and `VERCEL!=1` (both true under `bun run dev`).

Verification (per [docs/agent-onboarding.md](docs/agent-onboarding.md) §4 and `.github/workflows/ci.yml`): `bun run typecheck`, `bun test`, `bun run lint`. Note: `bun run lint` currently reports pre-existing errors in `src/providers/universus-media-dock/dock.tsx` (set-state-in-effect) unrelated to environment setup.
