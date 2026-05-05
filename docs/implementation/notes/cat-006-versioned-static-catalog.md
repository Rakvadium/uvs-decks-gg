# CAT-006 — Versioned static full catalog (gzip JSON on R2/CDN)

## Scope

Design for publishing a **single, versioned** gzip-compressed JSON artifact of the **gallery-eligible** card catalog to **R2** (and optionally a **CDN**), keyed by the same integer **`cardDataVersion`** the app already uses from Convex. **Implementation is out of scope for this note**; track as a follow-up backlog row when ready.

**Related:** [BACKLOG.md](../../BACKLOG.md) (row **CAT-006**), [card-data-hooks.md](../../card-data-hooks.md), `api.cards.getCardDataVersion`, `fetchFromConvex` / `listReleasedPaginated` in `src/lib/universus/use-universus-cards.ts`, IndexedDB in `src/lib/universus/card-store.ts`.

## Problem

Full sync today pulls many **paginated Convex queries**, which costs **round-trips and database reads** at scale. A **static blob** per catalog version lets the client do **one HTTP GET** (plus decompression and parse) while Convex continues to own **version metadata** and authoritative writes.

## Target artifact

| Aspect | Recommendation |
| --- | --- |
| Key / URL | **Immutable path** including version, e.g. `https://<cdn-host>/catalog/<env>/v<cardDataVersion>.json.gz` (or a prefix hash of version if you prefer opaque keys). Avoid a mutable `latest.json` as the only fetch target; the client should always derive the URL from **Convex-returned** `version` (and optional explicit `catalogBaseUrl`) so caches never serve stale “latest”. |
| Encoding | **gzip** body (`.json.gz` suffix or `Content-Encoding: gzip` with clear documentation). Browsers can decompress via **`DecompressionStream`** where supported, or a small inflate dependency if you must support older engines. |
| Payload shape | Match what the client already persists after sync: **gallery catalog rows only** (same rule as CAT-001 / `isGalleryCatalogCard`), same field normalization as today (e.g. public **R2 image URLs**). If companion/back rows are still merged client-side from separate structures, either **embed the same merged shape** the IDB writer expects or document a **stable schema version** inside the JSON (`schemaVersion`) alongside `cardDataVersion`. |
| Publisher | Convex **action** (or trusted worker) runs after ingest/version bump: build JSON, gzip, **`putObject`** to R2, then update Convex metadata (version was already bumped atomically with the data commit, or bump only after successful upload—pick one **documented** ordering to avoid clients seeing a version with no object). |

## Security

| Topic | Guidance |
| --- | --- |
| Sensitivity | Treat the blob as **world-readable catalog data**—equivalent to released gallery content. Do not put secrets, PII, or draft/unreleased cards in the export pipeline. |
| Integrity | Return a **cryptographic digest** of the compressed (or uncompressed—pick one and keep it consistent) blob from **`getCardDataVersion`** (e.g. `sha256`). The client **recomputes** after download/decode and **aborts** IDB write on mismatch. This mitigates CDN corruption, partial downloads mistaken as complete, and accidental wrong object at the path. |
| Transport | **HTTPS only**; prefer CDN defaults with **TLS 1.2+** and **HSTS** on the public hostname. |
| AuthZ on GET | **Optional** for this dataset: anonymous read is acceptable if the export is strictly public catalog data. If policy changes, use **short-lived signed URLs** issued by Convex to a **private** bucket, or a **same-origin** Next.js route that proxies the file (see CORS). |
| CORS | If the browser fetches the CDN **directly**, the bucket/CDN must emit **`Access-Control-Allow-Origin`** for your app origins (or `*` if acceptable for static public JSON). Alternatively, serve via **`/api/catalog/[version]`** Next route that streams from R2: **same-origin**, no CORS, at the cost of **Vercel/server egress** and implementation surface. |
| Abuse / cost | **Immutable URLs + long cache** reduce origin load. Optionally **WAF / rate limits** on the CDN; size caps on upload in the publisher action. |
| Parsing | Enforce a **maximum decompressed size** before `JSON.parse`; reject oversized or non-JSON content. Validate with the same **validators** used for Convex-returned card rows before touching IndexedDB. |

## Cache headers (CDN / R2)

For **versioned** objects (unique URL per `cardDataVersion`):

- **`Cache-Control: public, max-age=31536000, immutable`** (or another long `max-age`) so browsers and edge caches retain the object indefinitely; when data changes, **`cardDataVersion` changes** and the URL changes, so there is no stale-cache problem.
- Set **`Content-Type: application/json`** (with gzip file extension or `Content-Encoding: gzip` per your stack’s convention) so clients and intermediaries handle the body predictably.
- **`ETag`** derived from object hash is optional but helps debugging; **`immutable`** + versioned URL is the primary correctness story.

Avoid **`no-store`** on these assets unless you intentionally defeat caching.

## Fallback to existing Convex sync

The current path (**`getCardDataVersion`** → **`fetchFromConvex`** paginated **`listReleasedPaginated`**, merge, **`syncFromConvex`**, IndexedDB) remains the **authoritative fallback**:

| Condition | Behavior |
| --- | --- |
| Convex omits static catalog URL or digest | Use **Convex-only** sync (today’s behavior). |
| GET fails (network, 4xx/5xx, timeout) | Retry with backoff; then **fall back** to paginated Convex sync for that session. |
| Digest mismatch or JSON/schema failure | **Do not** write IDB; fall back to Convex sync; optionally log/metric. |
| Partial body | Treat as failure (digest check should catch); fall back. |
| Old clients | Ignore unknown fields on `getCardDataVersion`; if static fields absent, behavior unchanged. |

A **feature flag** (env or Convex config) can force Convex-only sync for debugging or incident response without redeploying clients.

## Client flow (implementation sketch)

1. Subscribe to **`getCardDataVersion`** as today.
2. If local IDB version matches server version, done.
3. If static catalog enabled and URL + digest present: **fetch** blob → decompress → verify digest → validate → **write IDB** + metadata in one logical transaction (same as post-Convex sync).
4. Else: **`fetchFromConvex`** as today.

## Follow-ups (not in this note)

- Concrete R2 bucket layout, CI vs Convex action ownership, retention of old `vN` objects.
- Whether **companions** / back-face merge belongs in the blob or stays a small secondary fetch.
- Metrics: static hit rate, fallback rate, p95 download size vs paginated byte totals.
