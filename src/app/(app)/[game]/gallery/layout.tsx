import type { Metadata } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";
import { cookies } from "next/headers";
import { isGameId, type GameId } from "@shared/games/types";
import { catalogCachedCookieName } from "@/lib/universus/catalog-prefetch";
import { catalogProxyPath } from "@/lib/universus/static-catalog";

export const metadata: Metadata = {
  title: "Card Gallery",
  description:
    "Search and filter the full UniVersus card database — sets, rarities, symbols, and card details.",
};

/** A slow lookup must not hold up the page; the client then downloads the catalog itself. */
const VERSION_LOOKUP_TIMEOUT_MS = 400;
const VERSION_LOOKUP_REVALIDATE_S = 30;

type CatalogVersion = { version: number; catalogUrl?: string };

/** Current catalog version and URL via Convex's HTTP query API, cached for a few seconds. */
async function getCatalogVersion(game: GameId): Promise<CatalogVersion | null> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  try {
    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "cards:getCardDataVersion", args: { game }, format: "json" }),
      next: { revalidate: VERSION_LOOKUP_REVALIDATE_S },
      signal: AbortSignal.timeout(VERSION_LOOKUP_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { status?: string; value?: CatalogVersion | null };
    return body.status === "success" ? (body.value ?? null) : null;
  } catch {
    return null;
  }
}

/**
 * Preloads the static catalog from the HTML head on first visits, so the download overlaps the
 * page JS instead of starting after it (src/lib/universus/catalog-prefetch.ts).
 */
export default async function GalleryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  if (isGameId(game)) {
    const [version, cookieStore] = await Promise.all([getCatalogVersion(game), cookies()]);
    const proxyPath = version?.catalogUrl ? catalogProxyPath(version.catalogUrl) : null;
    const cachedVersion = cookieStore.get(catalogCachedCookieName(game))?.value;
    if (version && proxyPath && cachedVersion !== String(version.version)) {
      preload(proxyPath, { as: "fetch", crossOrigin: "anonymous", fetchPriority: "high" });
    }
  }
  return children;
}
