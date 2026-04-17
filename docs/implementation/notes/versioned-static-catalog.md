# CAT-006 — Versioned static catalog via R2/CDN

**Status:** Defer — implement when first-load UX becomes a priority or catalog exceeds ~6 000 cards  
**Date:** 2026-04-16

## 1. Current architecture

```
Client                              Convex
  │                                   │
  ├─ useQuery(getCardDataVersion) ───►│  → returns { version, cardCount }
  │                                   │
  ├─ convex.query(listReleasedPaginated, { cursor, limit: 1000 }) ──►│
  │  ◄── { cards[], cursor, isDone } ─┤
  │  ... repeat ~5 times ...          │
  │                                   │
  ├─ setCachedCards(allCards) → IDB   │
  └─ setCacheMetadata(version) → IDB │
```

- `listReleasedPaginated` paginates raw `cards` rows at 1 000/page, server-side filters to gallery catalog cards (`isFrontFace !== false && isVariant !== true`), and maps `imageUrl` to public R2 URLs.
- ~5 000 raw rows → ~3 500 catalog cards → ~5 round-trips.
- Each card serialises to ~1 KB JSON → ~3.5 MB total uncompressed transfer across all pages.
- Cards are cached in IndexedDB via `idb-keyval`. Subsequent visits skip Convex entirely unless `cardDataVersion` changes.
- Version checks use `useQuery(api.cards.getCardDataVersion)`, which is a reactive subscription — re-syncs automatically when the admin bumps the version.

## 2. Proposed architecture

```
Admin action                 R2 (public bucket)              Client
  │                            │                               │
  ├─ Build catalog JSON ──────►│  PUT catalog/v{ver}.json.gz   │
  │                            │                               │
  │                            │          getCardDataVersion   │
  │                            │  ◄────────────────────────────┤
  │                            │                               │
  │                            │   GET catalog/v{ver}.json.gz  │
  │                            │  ◄────────────────────────────┤
  │                            ├──────────────────────────────►│
  │                            │         (~400–600 KB gzip)    │
  │                            │                               │
  │                            │                   IDB write   │
  │                            │                               │
```

### Generation pipeline

On card data ingest or admin `releaseCards`:

1. A Convex action reads all gallery catalog cards (paginated internally).
2. Builds a JSON array matching the `CachedCard` shape (including resolved `imageUrl`).
3. Gzip-compresses the payload.
4. Uploads to R2 at `catalog/v{version}.json.gz` using the S3-compatible API (existing bucket: `pub-53d81abf7a7f442a90c9383c1e7bdc60`).
5. Convex bumps `cardDataVersion` as today.

### Client sync flow

1. `useQuery(api.cards.getCardDataVersion)` fires as today (unchanged).
2. If `cachedVersion !== serverVersion`:
   - `fetch(`https://pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev/catalog/v${serverVersion}.json.gz`)`.
   - Browser decompresses gzip natively (via `Accept-Encoding` / transparent decode or raw `DecompressionStream`).
   - Parse with `response.json()`.
   - Write to IndexedDB as today.
3. **Fallback:** If the R2 fetch fails (404, network error, timeout > 10 s), fall back to current `listReleasedPaginated` pagination loop. Log the failure for observability.

## 3. Analysis

### Pros

| Benefit | Detail |
|---------|--------|
| Single HTTP request | 1 CDN GET vs ~5 Convex query round-trips. Eliminates serial waterfall latency (~2–4 s RTT on slow connections). |
| CDN cache-friendly | Versioned immutable URL — cacheable indefinitely at edge. Repeat visitors on the same version get sub-50 ms responses from cache. |
| Reduced Convex read units | Eliminates ~5 paginated reads per first-visit or version-bump sync. At scale this reduces Convex bandwidth/read costs. |
| Smaller transfer | Gzip compression: ~3.5 MB uncompressed → ~400–600 KB over the wire (JSON compresses well due to repeated field names and string patterns). |
| No new client dependencies | Browser `fetch()` + `Response.json()` handle gzip natively. No bundle impact. |

### Cons

| Cost | Detail |
|------|--------|
| R2 write pipeline | Requires a Convex action (Node runtime) with `@aws-sdk/client-s3` or `undici` PUT. New infrastructure code (~100–150 LOC). |
| Catalog generation step | Must run on every version bump. Pagination + serialize + gzip + upload adds ~5–15 s to the admin release flow. Acceptable as an async action. |
| R2 bucket management | Catalog objects accumulate. Need a cleanup policy (retain last N versions or TTL). Minor operational overhead. |
| Stale cache risk | If the CDN caches at an intermediate layer and the URL scheme is violated (e.g., overwriting the same key), stale data could be served. Mitigated by immutable versioned URLs. |
| Deployment coupling | The catalog blob must be generated before clients see the new version. If the action fails mid-way, `cardDataVersion` may bump without a corresponding blob. Mitigated by generating the blob first, then bumping version. |
| Added complexity | One more moving part in the sync pipeline. Fallback logic adds branching. |

### Security

- The R2 bucket (`pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev`) is already public and serves card images.
- Card catalog data is entirely non-sensitive (card names, stats, set info, public image URLs).
- No authentication needed for catalog reads.
- R2 write credentials (API token or service key) would be stored as Convex environment variables, never exposed to the client.

### Cache headers

The catalog blob should be served with:

```
Cache-Control: public, max-age=31536000, immutable
Content-Type: application/json
Content-Encoding: gzip
```

Since the URL includes the version number (`catalog/v42.json.gz`), the content at any given URL never changes. `immutable` tells browsers and CDN edges to never revalidate. Old versions can be garbage-collected server-side on a schedule.

### Fallback to Convex sync

```
async function fetchCatalog(version: number): Promise<CachedCard[]> {
  const url = `https://pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev/catalog/v${version}.json.gz`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`R2 ${res.status}`);
    return await res.json();
  } catch {
    return fetchFromConvex();
  }
}
```

### Bundle cost

Zero. No new npm dependencies. Browser `fetch` handles `Content-Encoding: gzip` transparently. `Response.json()` parses the decompressed body.

## 4. Verdict

**Defer.**

The current sync works and is already cached in IndexedDB — repeat visitors pay zero sync cost. The ~5 round-trip first-load penalty (~10–20 s on slow connections, ~3–5 s on fast) is noticeable but not blocking for a TCG deckbuilding tool where users are typically returning visitors after the initial load.

Reasons to defer:

- **Low frequency of cold starts.** IndexedDB cache persists across sessions. Users only re-sync when `cardDataVersion` bumps (admin card releases, roughly monthly).
- **Operational overhead vs. gain.** Adding an R2 write pipeline, S3 credentials, cleanup policy, and fallback logic is non-trivial for a gain that only affects first-visit or version-bump scenarios.
- **Current catalog size is manageable.** At ~3 500 cards and ~5 round-trips, the existing approach is within acceptable bounds. The benefit-to-cost ratio improves significantly at larger catalog sizes.

Conditions to revisit:

- Catalog exceeds ~6 000 gallery cards (round-trips would grow to ~8+).
- First-load UX becomes a product priority (e.g., onboarding funnel, marketing landing page).
- Convex read-unit costs become a concern at scale.
- A CDN-first data delivery strategy is adopted for other assets (e.g., set metadata, format definitions).

## 5. Follow-up backlog rows (if implementing)

| ID | Area | Summary |
|----|------|---------|
| CAT-006a | Convex action | R2 catalog upload action: paginate all gallery catalog cards, serialize to JSON, gzip, PUT to `catalog/v{version}.json.gz` via S3-compatible API. Run as post-step of `releaseCards`. |
| CAT-006b | Client | Static catalog fetch: add `fetchFromR2` path in `use-universus-cards.ts` with 10 s timeout, fallback to `fetchFromConvex`. |
| CAT-006c | Infra | R2 catalog cleanup: scheduled Convex action or Cloudflare Worker to delete catalog blobs older than N versions. |
| CAT-006d | Observability | Log R2 fetch success/failure/fallback rates (e.g., simple counter in Convex or client-side analytics event). |
