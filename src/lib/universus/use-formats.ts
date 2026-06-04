"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

export type CachedFormat = Doc<"formats">;
export type SetLegality = Doc<"setLegality">;
export type CardLegalityRow = Doc<"cardLegality">;

export interface UseFormatsResult {
  formats: CachedFormat[];
  setLegalities: Map<string, SetLegality[]>;
  cardLegalities: Map<string, CardLegalityRow[]>;
  isLoading: boolean;
  error: Error | null;
  getFormatByKey: (key: string) => CachedFormat | undefined;
  isSetLegalInFormat: (setCode: string, formatKey: string) => boolean;
  isCardBannedInFormat: (formatKey: string, cardId: string) => boolean;
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
  const [cardLegalities, setCardLegalities] = useState<Map<string, CardLegalityRow[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const convex = useConvex();
  const isHydrated = useIsClient();

  const fetchFormats = useCallback(async () => {
    try {
      const result = await convex.query(api.formats.list, {});
      setFormats(result);
      
      const legalitiesMap = new Map<string, SetLegality[]>();
      const cardLegalitiesMap = new Map<string, CardLegalityRow[]>();
      for (const format of result) {
        const [legalities, cardLegRows] = await Promise.all([
          convex.query(api.formats.getSetLegalityByFormat, {
            formatKey: format.key,
          }),
          convex.query(api.formats.getCardLegalityByFormat, {
            formatKey: format.key,
          }),
        ]);
        legalitiesMap.set(format.key, legalities);
        cardLegalitiesMap.set(format.key, cardLegRows);
      }
      setSetLegalities(legalitiesMap);
      setCardLegalities(cardLegalitiesMap);
      
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

  const isCardBannedInFormat = useCallback((formatKey: string, cardId: string): boolean => {
    const rows = cardLegalities.get(formatKey);
    if (!rows) return false;
    const entry = rows.find((r) => r.cardId === cardId);
    if (!entry || entry.status !== "banned") return false;
    const now = Date.now();
    if (entry.effectiveDate !== undefined && entry.effectiveDate > now) return false;
    return true;
  }, [cardLegalities]);

  useEffect(() => {
    if (!isHydrated) return;
    fetchFormats();
  }, [isHydrated, fetchFormats]);

  return {
    formats,
    setLegalities,
    cardLegalities,
    isLoading,
    error,
    getFormatByKey,
    isSetLegalInFormat,
    isCardBannedInFormat,
    isHydrated,
  };
}
