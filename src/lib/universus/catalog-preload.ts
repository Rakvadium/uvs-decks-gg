/**
 * `Link: rel=preload` header for the static catalog, sent by the middleware on gallery page
 * requests so the browser starts the download before any HTML arrives
 * (src/lib/universus/catalog-prefetch.ts has the client side).
 */
import type { GameId } from "@shared/games/types";
import { catalogProxyPath } from "./static-catalog";

/** A slow lookup must not hold up the page; the client then downloads the catalog itself. */
const LOOKUP_TIMEOUT_MS = 200;
const CACHE_TTL_MS = 60_000;
const FAILURE_TTL_MS = 10_000;

type CatalogTarget = { version: number; proxyPath: string };
type CacheEntry = { target: CatalogTarget | null; expiresAt: number };

const cache = new Map<GameId, CacheEntry>();
const inFlight = new Map<GameId, Promise<CatalogTarget | null>>();

async function lookupCatalogTarget(game: GameId): Promise<CatalogTarget | null> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  try {
    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "cards:getCardDataVersion", args: { game }, format: "json" }),
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      status?: string;
      value?: { version: number; catalogUrl?: string } | null;
    };
    const value = body.status === "success" ? body.value : null;
    const proxyPath = value?.catalogUrl ? catalogProxyPath(value.catalogUrl) : null;
    return value && proxyPath ? { version: value.version, proxyPath } : null;
  } catch {
    return null;
  }
}

/** Current catalog version and proxy path, cached in memory for a minute per game. */
async function getCatalogTarget(game: GameId): Promise<CatalogTarget | null> {
  const cached = cache.get(game);
  if (cached && cached.expiresAt > Date.now()) return cached.target;

  let pending = inFlight.get(game);
  if (!pending) {
    pending = lookupCatalogTarget(game).then((target) => {
      cache.set(game, {
        target,
        expiresAt: Date.now() + (target ? CACHE_TTL_MS : FAILURE_TTL_MS),
      });
      inFlight.delete(game);
      return target;
    });
    inFlight.set(game, pending);
  }
  return pending;
}

/**
 * The `Link` header value preloading `game`'s catalog, or `null` when this browser already caches
 * that version (`cachedVersion`, from the catalog-version cookie) or the lookup failed.
 */
export async function catalogPreloadLink(
  game: GameId,
  cachedVersion: string | undefined
): Promise<string | null> {
  const target = await getCatalogTarget(game);
  if (!target || cachedVersion === String(target.version)) return null;
  return `<${target.proxyPath}>; rel=preload; as=fetch; crossorigin=anonymous; fetchpriority=high`;
}
