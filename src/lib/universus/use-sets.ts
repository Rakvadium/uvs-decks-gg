"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore, useMemo } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  getCachedSets,
  setCachedSets,
  getSetCacheMetadata,
  setSetCacheMetadata,
  buildSetIndex,
  SetIndex,
  SetCacheMetadata,
} from "./set-store";
import type { CachedSet } from "./set-store";

export type { CachedSet } from "./set-store";
export { isSetLegalInFormat, getFormatsForSet, getSetByCode, parseSetLegality } from "./set-store";

export interface UseSetsResult {
  sets: CachedSet[];
  isLoading: boolean;
  isSyncing: boolean;
  cachedVersion: number | null;
  error: Error | null;
  index: SetIndex | null;
  refreshSets: () => Promise<void>;
  getSetByCode: (code: string) => CachedSet | undefined;
  isHydrated: boolean;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

interface UseSetsOptions {
  serverVersion?: number | null;
}

export function useSets(options: UseSetsOptions = {}): UseSetsResult {
  const { serverVersion } = options;
  
  const [sets, setSets] = useState<CachedSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cachedVersion, setCachedVersion] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [index, setIndex] = useState<SetIndex | null>(null);
  
  const syncInProgress = useRef(false);
  const initialLoadDone = useRef(false);
  const convex = useConvex();
  const isHydrated = useIsClient();

  const loadFromCache = useCallback(async (): Promise<{ hasCache: boolean; version: number | null }> => {
    try {
      const [cachedSets, metadata] = await Promise.all([
        getCachedSets(),
        getSetCacheMetadata(),
      ]);
      
      if (cachedSets.length > 0 && metadata) {
        setSets(cachedSets);
        setCachedVersion(metadata.version ?? null);
        const setsIndex = buildSetIndex(cachedSets);
        setIndex(setsIndex);
        setIsLoading(false);
        return { hasCache: true, version: metadata.version ?? null };
      }
      return { hasCache: false, version: null };
    } catch (err) {
      console.error("Failed to load sets from cache:", err);
      return { hasCache: false, version: null };
    }
  }, []);

  const fetchFromConvex = useCallback(async (): Promise<CachedSet[]> => {
    const result = await convex.query(api.sets.list, {});
    return result;
  }, [convex]);

  const syncFromConvex = useCallback(async (serverSets: CachedSet[], version: number) => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    setIsSyncing(true);
    
    try {
      const now = Date.now();
      
      await setCachedSets(serverSets);
      await setSetCacheMetadata({
        version,
        updatedAt: now,
        setCount: serverSets.length,
      });
      
      setSets(serverSets);
      setCachedVersion(version);
      const setsIndex = buildSetIndex(serverSets);
      setIndex(setsIndex);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        console.error("Failed to sync sets:", err);
      }
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, []);

  const refreshSets = useCallback(async () => {
    if (serverVersion === null || serverVersion === undefined) return;
    setIsLoading(true);
    syncInProgress.current = false;
    const freshSets = await fetchFromConvex();
    await syncFromConvex(freshSets, serverVersion);
  }, [fetchFromConvex, syncFromConvex, serverVersion]);

  const getSetByCodeFn = useCallback((code: string): CachedSet | undefined => {
    return index?.byCode.get(code);
  }, [index]);

  useEffect(() => {
    if (!isHydrated) return;
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    const initializeSets = async () => {
      await loadFromCache();
    };
    
    initializeSets();
  }, [isHydrated, loadFromCache]);

  useEffect(() => {
    if (!isHydrated) return;
    if (serverVersion === null || serverVersion === undefined) return;
    if (syncInProgress.current) return;
    
    const checkAndSync = async () => {
      if (cachedVersion === null) {
        setIsLoading(true);
        const freshSets = await fetchFromConvex();
        await syncFromConvex(freshSets, serverVersion);
        return;
      }
      
      if (cachedVersion !== serverVersion) {
        console.log(`Sets cache outdated: local v${cachedVersion} vs server v${serverVersion}`);
        const freshSets = await fetchFromConvex();
        await syncFromConvex(freshSets, serverVersion);
      }
    };
    
    checkAndSync();
  }, [isHydrated, serverVersion, cachedVersion, fetchFromConvex, syncFromConvex]);

  return useMemo(
    () => ({
      sets,
      isLoading: isLoading && sets.length === 0,
      isSyncing,
      cachedVersion,
      error,
      index,
      refreshSets,
      getSetByCode: getSetByCodeFn,
      isHydrated,
    }),
    [
      sets,
      isLoading,
      isSyncing,
      cachedVersion,
      error,
      index,
      refreshSets,
      getSetByCodeFn,
      isHydrated,
    ]
  );
}
