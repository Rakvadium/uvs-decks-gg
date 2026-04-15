# Deployment — tcg-decks

## Expected hosting pattern

- **Web:** Vercel or compatible Next.js host for the Next.js application.
- **Backend:** Convex Cloud (or self-hosted Convex if you adopt that path); deploy functions and schema with the Convex CLI per project docs.

## Environment

- Configure Convex deployment URL and auth secrets in the environment expected by Next.js and Convex (see Convex dashboard and local `.env` conventions).
- Object storage (R2) requires provider credentials and bucket configuration wired through Convex components.

## Data and migrations

- Schema changes go through `convex/schema.ts` and Convex migrations or backfills when required.
- Card and set imports use repository scripts; run only with appropriate credentials and after reviewing impact on production data.

## Related

- [TECH_STACK_DETAILS.md](./TECH_STACK_DETAILS.md)
- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)
