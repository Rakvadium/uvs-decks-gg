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
  - **Read only against the cloud, allowed:** only `convex logs`, `convex function-spec`, and env var names through this filter. In bash (Git Bash on Windows), from the checkout root, it prints names the repo already uses, plus a count of other entries. A repeated name means a multi-line value, not two entries.

    ```bash
    known="$(grep -rhoE 'process\.env\.[A-Z][A-Z0-9_]*' convex | cut -d. -f3 | sort -u | paste -sd'|')|JWKS|JWT_PRIVATE_KEY|SITE_URL|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_ENDPOINT|R2_BUCKET"
    bunx convex env list | awk -F= -v k="^($known)\$" '/^[A-Z][A-Z0-9_]*=/ { if ($1 ~ k) print $1; else n++ } END { print (n+0) " other NAME= lines (not printed)" }'
    ```

    Against the cloud deployment, never run `env get` or an unfiltered `env list`, and never redirect their output to a file.
  - **Any write or deploy that reaches the cloud deployment, by any route, needs explicit human approval of the exact command.** Every `convex` command not listed above counts as a write. That includes `export` (downloads every table), `data` (prints live rows), `mcp start`, `integration`, and any Convex MCP server pointed at the cloud. `convex deploy` always targets a cloud deployment, and so does any command with `--prod`, `--url`, `--deployment-name`, `--env-file`, `--admin-key` or `--preview-*`.
  - **Local Convex work goes only through the guarded wrapper** ([scripts/validation/README.md](scripts/validation/README.md)). Use your app port `P`, which must be in 8100–8199:

    ```bash
    bun run validation:backend -- start --app-port <P>          # local backend + dev watcher
    bun run vconvex -- --app-port <P> --check <convex args>     # self-check the real command
    bun run vconvex -- --app-port <P> <convex args>             # e.g. run sets:list, env get <NAME>
    bun run validation:backend -- stop --app-port <P>
    ```

    - A pass means `target=local`, a final `OK: …` line and exit 0. Anything else means stop.
    - Pass the real command's args to `--check` so the subcommand and flag rules run too.
    - `bun run vconvex -- --app-port <P> dev --once` does a one-shot push when no backend is running.
    - `vconvex` refuses `deploy`, `mcp`, `integration` and every target flag. Those stay approval-only.
  - `start` runs codegen, which can rewrite `convex/_generated/*` and `.cursor/rules/convex_rules.mdc`. Run `git restore` on them unless your change needs them.

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

## Stack and verification

Next.js 16 (App Router, React 19) + Convex backend, **Bun** as package manager/runner. `bun run dev` serves **http://localhost:8090** (port is hardcoded).

Verification (per [docs/agent-onboarding.md](docs/agent-onboarding.md) §4 and `.github/workflows/ci.yml`): `bun run typecheck`, `bun test`, `bun run lint`. Note: `bun run lint` currently reports pre-existing errors in `src/providers/universus-media-dock/dock.tsx` (set-state-in-effect) unrelated to environment setup.

## Cursor Cloud (legacy)

The owner no longer uses this flow. These notes are kept for reference.

- Cursor Cloud injects `CONVEX_DEPLOY_KEY`, `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`, which point at the cloud deployment that serves the live site. `vconvex` refuses that env, so **Cursor Cloud has no local Convex route**. Every Convex write there needs explicit human approval of the exact command. Run capture and verify flows on a local machine.
- Never run raw `bunx convex dev` there. It deploys your functions to the live site and rewrites `.env.local`.
- The deployment's env var names are `JWKS`, `JWT_PRIVATE_KEY`, `R2_*`, `OPENAI_API_KEY`, `YOUTUBE_DATA_API_KEY`, `ADMIN_API_KEY` and `AUTH_RESEND_KEY`. List them only with the filter in Secrets and live data.
- `AGENT_AUTH_SECRET`, `AGENT_AUTH_EMAIL`, `AGENT_AUTH_PASSWORD` and `AGENT_AUTH_USERNAME` are injected, so `/agent-login` works without setup ([docs/agent-onboarding.md](docs/agent-onboarding.md) §6). Open `http://localhost:8090/agent-login?token=$AGENT_AUTH_SECRET&next=/decks` in a real browser, not curl. It only works when `NODE_ENV=development` and `VERCEL!=1`.
