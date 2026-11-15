/**
 * Early catalog download for first visits.
 *
 * The gallery layout preloads the static catalog from the server HTML (`<link rel="preload">`),
 * so the download runs while the page JS loads and the client loader's fetch is served from the
 * preload. A cookie holding the catalog version this browser has in IndexedDB lets the server skip
 * the preload for browsers that already have it.
 */
import type { GameId } from "@shared/games/types";
import { STORAGE_NAMESPACE } from "@/lib/storage-keys";

const ONE_YEAR_S = 60 * 60 * 24 * 365;

/** Cookie with the catalog version cached in this browser's IndexedDB, per game. */
export function catalogCachedCookieName(game: GameId): string {
  return `${STORAGE_NAMESPACE}-${game}-catalog-version`;
}

/** Records the catalog version now in IndexedDB (`null`: none), so the server can skip the preload. */
export function markCatalogCached(game: GameId, version: number | null): void {
  if (typeof document === "undefined") return;
  const name = catalogCachedCookieName(game);
  document.cookie =
    version === null
      ? `${name}=; path=/; max-age=0; samesite=lax`
      : `${name}=${version}; path=/; max-age=${ONE_YEAR_S}; samesite=lax`;
}
