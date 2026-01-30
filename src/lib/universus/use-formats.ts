"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

export type CachedFormat = Doc<"formats">;
export type SetLegality = Doc<"setLegality">;

export interface UseFormatsResult {
  formats: CachedFormat[];
  setLegalities: Map<string, SetLegality[]>;
  isLoading: boolean;
  error: Error | null;
  getFormatByKey: (key: string) => CachedFormat | undefined;
  isSetLegalInFormat: (setCode: string, formatKey: string) => boolean;
  isHydrated: boolean;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

export function useFormats(): UseFormatsResult {
  const [formats, setFormats] = useState<CachedFormat[]>([]);
  const [setLegalities, setSetLegalities] = useState<Map<string, SetLegality[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const convex = useConvex();
  const isHydrated = useIsClient();

  const fetchFormats = useCallback(async () => {
    try {
      const result = await convex.query(api.formats.list, {});
      setFormats(result);
      
      const legalitiesMap = new Map<string, SetLegality[]>();
      for (const format of result) {
        const legalities = await convex.query(api.formats.getSetLegalityByFormat, {
          formatKey: format.key,
        });
        legalitiesMap.set(format.key, legalities);
      }
      setSetLegalities(legalitiesMap);
      
      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      }
      setIsLoading(false);
    }
  }, [convex]);

  const getFormatByKey = useCallback((key: string): CachedFormat | undefined => {
    return formats.find((f) => f.key === key);
  }, [formats]);

  const isSetLegalInFormat = useCallback((setCode: string, formatKey: string): boolean => {
    const legalities = setLegalities.get(formatKey);
    if (!legalities) return true;
    
    const entry = legalities.find((l) => l.setCode === setCode);
    if (!entry) return true;
    
    if (entry.rotatesOutAt && entry.rotatesOutAt < Date.now()) {
      return false;
    }
    
    return entry.isLegal;
  }, [setLegalities]);

  useEffect(() => {
    if (!isHydrated) return;
    fetchFormats();
  }, [isHydrated, fetchFormats]);

  return {
    formats,
    setLegalities,
    isLoading,
    error,
    getFormatByKey,
    isSetLegalInFormat,
    isHydrated,
  };
}
