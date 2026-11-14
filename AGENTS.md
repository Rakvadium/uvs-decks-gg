# AGENTS.md

## Stack

Next.js 16 (App Router, React 19) with a Convex backend. Bun is the package manager and runner.

## Commands

- `bunx convex dev` (local backend) plus `bun run dev` (port 8090, or `PORT` in `.env.local`). Test multi-game work on http://tcgdecks.localhost:8090, http://uvs.tcgdecks.localhost:8090 and http://cyberpunk.tcgdecks.localhost:8090. Plain `localhost:8090` is single-game UVS. Sign in with the `LOCAL_TEST_*` account from `.env.local`; `bun run local:seed --admin` (re)creates it. Details, smoke test and data refresh: [docs/local-convex.md](docs/local-convex.md).
- In a new worktree, run `bun install` then `bun run worktree:setup` before anything else.
- `bun run typecheck`, `bun test` and `bun run lint` are the CI gates. `bun run lint` reports pre-existing errors in `src/providers/universus-media-dock/dock.tsx`.
- `bun run lint:design` checks design-system usage. `bun run design:codemod` applies its fixes.

## Workflow

This repo uses oddstack (user-level install). Use `/odd-mode` for non-trivial work. No verification skill is set up yet. Run `/create-verification-skill` to create one.

## Hard rules

- The `.env.local` in the main checkout points at the live production Convex deployment. Never run a Convex CLI command, migration or deploy against it without the owner's explicit approval of the exact command.
- Branch work uses a local Convex deployment: [docs/local-convex.md](docs/local-convex.md). Production Convex deploys come from `dev`/`master` (`multi-game-platform` is fully merged). Before and after a deploy, diff the full `convex function-spec` output, not just function names.
- Write env var names, never values, in tracked files, commits, PR text and logs.
- Ask before starting new infra or side fixes.
- PRs target `dev`.

## UI

Use ShadCN and MagicUI for styling and components when possible.

- Tokens and patterns: [docs/UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md)
- Feature modules: [docs/component-architecture-playbook.md](docs/component-architecture-playbook.md)
- Desktop header actions: [docs/floating-header-islands.md](docs/floating-header-islands.md)
- Mobile chrome: [docs/mobile-shell.md](docs/mobile-shell.md)
- The `/design` route (`next dev` and Vercel previews) is the live design-system catalog.

Docs hub: [docs/README.md](docs/README.md).
