import { DEFAULT_GAME_ID } from "../shared/games/types";

export const PUBLIC_R2_BASE_URL =
  "https://pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev";

export const CATALOG_STATIC_SCHEMA_VERSION = 1;

export function toPublicCardImageUrl(imageUrl?: string) {
  if (!imageUrl) {
    return undefined;
  }

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `${PUBLIC_R2_BASE_URL}/cards/${imageUrl}`;
}

/** Per-game catalog blob key: `catalog/{game}/v{n}.json.gz` (docs/multi-game.md "Catalog, storage keys"). */
export function catalogObjectKeyForVersion(game: string, version: number): string {
  return `catalog/${game}/v${version}.json.gz`;
}

/** Pre-multi-game catalog key (`catalog/v{n}.json.gz`); only the default game ever published these. */
export function legacyCatalogObjectKeyForVersion(version: number): string {
  return `catalog/v${version}.json.gz`;
}

/**
 * Keys to delete when retiring catalog `version` of `game`: only that game's key, plus the
 * legacy unprefixed key for the default game (it published `catalog/v{n}` before Phase 2).
 */
export function catalogObjectKeysToDelete(game: string, version: number): string[] {
  if (!Number.isInteger(version) || version < 1) return [];
  const keys = [catalogObjectKeyForVersion(game, version)];
  if (game === DEFAULT_GAME_ID) {
    keys.push(legacyCatalogObjectKeyForVersion(version));
  }
  return keys;
}

export function toPublicCatalogUrl(game: string, version: number): string {
  return `${PUBLIC_R2_BASE_URL}/${catalogObjectKeyForVersion(game, version)}`;
}
