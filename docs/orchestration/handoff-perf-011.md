# Handoff: PERF-011 (Route-level code splitting)

## Shipped

- **`RouteChunkFallback`:** Centered primary ring spinner (`border-primary`), full-width / min-height shell-friendly container (`src/components/shell/route-chunk-fallback.tsx`).
- **Dynamic routes (`next/dynamic`, `ssr: true`):** Admin dashboard, cards, sets, import, UI matrix; community tier-lists index and tier-list detail view; settings; collection. Co-located `*-page-client.tsx` modules hold the previous default page implementations where the route was previously a single client file.

## Verify manually

- Navigate to each split route from a cold load: brief spinner, then full UI; no hydration errors in the console.
- Tier list detail: metadata still resolves via `generateMetadata`; board and DnD behave as before.

## Follow-ups (optional)

- PERF-012: trim barrel imports on hot paths.
- Analyze `@next/bundle-analyzer` or build stats if you need named chunk sizes in CI.
