/**
 * localStorage key + window event naming (see docs/multi-game.md "Catalog, storage keys").
 *
 * - Game-scoped UI state: `tcgdecks:{game}:{key}`
 * - Global UI state:      `tcgdecks:{key}`
 * - Window events:        `tcgdecks:{name}`
 *
 * Pre-multi-game builds wrote `uvs-decks*` keys. Readers pass the legacy key so the first read
 * migrates it (copy to the new key, delete the old one). Game-scoped legacy keys only apply to
 * `uvs`, the only game those builds knew about.
 */
import type { GameId } from "@shared/games/types";

export const STORAGE_NAMESPACE = "tcgdecks";

/** The only game whose data lived under the legacy `uvs-decks*` keys. */
const LEGACY_GAME: GameId = "uvs";

export function globalStorageKey(key: string): string {
  return `${STORAGE_NAMESPACE}:${key}`;
}

export function gameStorageKey(game: GameId, key: string): string {
  return `${STORAGE_NAMESPACE}:${game}:${key}`;
}

/** Window `CustomEvent` name in the app namespace. */
export function appEventName(name: string): string {
  return `${STORAGE_NAMESPACE}:${name}`;
}

/** Legacy key for a game-scoped value, or null when `game` never had legacy storage. */
export function legacyGameKey(game: GameId, legacyKey: string): string | null {
  return game === LEGACY_GAME ? legacyKey : null;
}

/** IndexedDB name for a game's client catalog cache: `tcgdecks-{game}-{kind}`. */
export function catalogDbName(game: GameId, kind: "cards" | "sets"): string {
  return `${STORAGE_NAMESPACE}-${game}-${kind}`;
}

const deletedLegacyDatabases = new Set<string>();

/**
 * Best-effort `indexedDB.deleteDatabase(name)`, at most once per page load. Used for the
 * pre multi-game `universus-*` catalog DBs (the catalog re-downloads into the per-game DB).
 */
export function deleteLegacyDatabaseOnce(
  name: string,
  factory: Pick<IDBFactory, "deleteDatabase"> | null = typeof indexedDB === "undefined"
    ? null
    : indexedDB,
): void {
  if (!factory || deletedLegacyDatabases.has(name)) {
    return;
  }
  deletedLegacyDatabases.add(name);
  try {
    // Deleting a missing DB succeeds; a "blocked" delete (another tab has it open) finishes later.
    factory.deleteDatabase(name);
  } catch {
    // Ignore: best effort only.
  }
}

type StorageLike =Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Read `key`; when missing, fall back to `legacyKey` and migrate it (write new, remove old).
 * Never throws (private mode / quota errors read as null or keep the legacy value).
 */
export function readStorageWithLegacy(
  key: string,
  legacyKey: string | null,
  storage: StorageLike | null = defaultStorage(),
): string | null {
  if (!storage) {
    return null;
  }
  try {
    const value = storage.getItem(key);
    if (value !== null || !legacyKey || legacyKey === key) {
      return value;
    }
    const legacy = storage.getItem(legacyKey);
    if (legacy === null) {
      return null;
    }
    try {
      storage.setItem(key, legacy);
      storage.removeItem(legacyKey);
    } catch {
      // Keep the legacy key if the copy failed; the value is still returned.
    }
    return legacy;
  } catch {
    return null;
  }
}
