Before implementing code, check to see if any of the available skills are going to be relevant to the taks before implmenting. If one of them is relevant, use it.

The current skills are:
- vercel-composition-patterns
- vercel-react-best-practices
- vercel-react-native-skills
- vercel-design-guidelines

Use ShadCN and MagicUI for all styling and component choices when possible.

Project documentation hub: [docs/README.md](docs/README.md). UI module structure: [docs/component-architecture-playbook.md](docs/component-architecture-playbook.md).

## Cursor Cloud specific instructions

### Tech stack
- **Package manager:** Bun (lockfile: `bun.lock`). Use `bun install`, `bun run <script>`, `bun test`.
- **Frontend:** Next.js 16 (App Router) on port 8090.
- **Backend:** Convex (cloud-hosted BaaS — no local DB needed).
- **Auth:** `@convex-dev/auth` with email/password + Resend OTP for password reset.

### Running services
| Service | Command | Notes |
|---------|---------|-------|
| Next.js dev server | `bun run dev` | Runs on port 8090. Requires `NEXT_PUBLIC_CONVEX_URL` env var. |
| Convex dev backend | `npx convex dev` | Syncs functions/schema to Convex Cloud. Requires Convex auth (run `npx convex login` first). |

### Required environment variables
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL (set in `.env.local`). Without it, the ConvexReactClient will throw.
- Convex CLI needs authentication via `npx convex login` or a `CONVEX_DEPLOY_KEY`.

### Key commands
- **Lint:** `bun run lint` (ESLint with next/core-web-vitals + typescript configs)
- **Test:** `bun run test` (Bun test runner, tests in `tests/` directory)
- **Build:** `bun run build` (Next.js production build with webpack)
- **Dev:** `bun run dev` (Next.js dev server on port 8090)

### Gotchas
- The project uses `next build --webpack` (not Turbopack) for production builds.
- Convex functions live in `convex/` directory. Schema is at `convex/schema.ts`.
- The `shadcn-reference/` directory is excluded from lint and TypeScript — it contains reference snippets only.
- Bun is the required package manager; `bun.lock` is the lockfile. Do not use npm/pnpm/yarn.
- The app redirects `/` to `/gallery` via middleware.