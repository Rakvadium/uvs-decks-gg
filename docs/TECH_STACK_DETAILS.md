# Tech stack details — tcg-decks

Prefer **live repo state** (`package.json`, `convex.json`, `next.config.ts`) over this file when they disagree.

## Runtime

| Layer | Choice |
| --- | --- |
| Language | TypeScript |
| Package manager / runner | Bun (`bun install`, `bun run …`) |
| Web framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix-based primitives, Framer Motion |

## Backend and data

| Layer | Choice |
| --- | --- |
| Backend | Convex |
| Auth | `@convex-dev/auth` |
| Object storage | `@convex-dev/r2` (and related AWS SDK usage where present) |

## Notable libraries

- **Data fetching / cache:** TanStack Query with persistence helpers where configured.
- **Validation:** `convex/values` validators in Convex; `zod` on the client where used.
- **Email:** Resend

## Scripts (from package.json)

- `bun run dev` — Next dev server (port 8090)
- `bun run build` — Production build
- `bun run lint` — ESLint
- Import and maintenance scripts for UniVersus data under `bun run import:universus` and related entries

## Verification (contributors)

Until a dedicated test script is added, a practical baseline is:

- `bun run lint`
- `bun run build`

Convex codegen is run as part of normal Convex workflows when changing functions or schema.
