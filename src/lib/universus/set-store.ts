import type { Doc } from "../../../convex/_generated/dataModel";
import type { GameId } from "@shared/games/types";
import { catalogDbName, deleteLegacyDatabaseOnce } from "@/lib/storage-keys";

export type CachedSet = Doc<"sets">;

export interface SetCacheMetadata {
  version?: number;
  updatedAt: number;
  setCount: number;
}

const LEGACY_DB_NAME = "universus-sets";
const STORE_NAME = "sets";
const METADATA_KEY = "cache-metadata";
const SETS_KEY = "sets-data";

const setStorePromises = new Map<GameId, Promise<ReturnType<typeof import("idb-keyval").createStore>>>();

async function getSetStore(game: GameId) {
  if (typeof window === "undefined") return null;
  
  let storePromise = setStorePromises.get(game);
  if (!storePromise) {
    // Pre multi-game DB; sets re-sync into the per-game DB instead.
    deleteLegacyDatabaseOnce(LEGACY_DB_NAME);
    storePromise = import("idb-keyval").then(({ createStore }) => {
      return createStore(catalogDbName(game, "sets"), STORE_NAME);
    });
    setStorePromises.set(game, storePromise);
  }

  return storePromise;
}

export async function getSetCacheMetadata(game: GameId): Promise<SetCacheMetadata | null> {
  const store = await getSetStore(game);
  if (!store) return null;
  
  try {
    const { get } = await import("idb-keyval");
    const metadata = await get<SetCacheMetadata>(METADATA_KEY, store);
    return metadata ?? null;
  } catch {
    return null;
  }
}

export async function setSetCacheMetadata(game: GameId, metadata: SetCacheMetadata): Promise<void> {
  const store = await getSetStore(game);
  if (!store) return;
  
  try {
    const { set } = await import("idb-keyval");
    await set(METADATA_KEY, metadata, store);
  } catch (error) {
    console.error("Failed to save set cache metadata:", error);
  }
}

export async function getCachedSets(game: GameId): Promise<CachedSet[]> {
  const store = await getSetStore(game);
  if (!store) return [];
  
  try {
    const { get } = await import("idb-keyval");
    const sets = await get<CachedSet[]>(SETS_KEY, store);
    return sets ?? [];
  } catch {
    return [];
  }
}

export async function setCachedSets(game: GameId, sets: CachedSet[]): Promise<void> {
  const store = await getSetStore(game);
  if (!store) return;
  
  try {
    const { set } = await import("idb-keyval");
    await set(SETS_KEY, sets, store);
  } catch (error) {
    console.error("Failed to save sets to cache:", error);
  }
}

export async function clearSetCache(game: GameId): Promise<void> {
  const store = await getSetStore(game);
  if (!store) return;
  
  try {
    const { del } = await import("idb-keyval");
    await del(METADATA_KEY, store);
    await del(SETS_KEY, store);
  } catch (error) {
    console.error("Failed to clear set cache:", error);
  }
}

export interface SetIndex {
  byCode: Map<string, CachedSet>;
  bySetNumber: Map<number, CachedSet>;
}

export function buildSetIndex(sets: CachedSet[]): SetIndex {
  const index: SetIndex = {
    byCode: new Map(),
    bySetNumber: new Map(),
  };

  for (const set of sets) {
    index.byCode.set(set.code, set);
    if (set.setNumber !== undefined) {
      index.bySetNumber.set(set.setNumber, set);
    }
  }

  return index;
}

export function getSetByCode(sets: CachedSet[], code: string): CachedSet | undefined {
  return sets.find((s) => s.code === code);
}

export function parseSetLegality(legality: string | undefined): string[] {
  if (!legality) return [];
  return legality.split("|").map((f) => f.trim()).filter(Boolean);
}

export function isSetLegalInFormat(set: CachedSet, formatKey: string): boolean {
  if (!set.legality) return true;
  const formats = parseSetLegality(set.legality);
  if (formats.length === 0) return true;
  return formats.includes(formatKey);
}

export function getFormatsForSet(set: CachedSet): string[] {
  return parseSetLegality(set.legality);
}
