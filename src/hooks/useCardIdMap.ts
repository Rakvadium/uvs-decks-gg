"use client";

import { useMemo } from "react";
import type { CachedCard } from "@/lib/universus";

export function useCardIdMap(cards: CachedCard[]) {
  return useMemo(() => {
    const map = new Map<string, CachedCard>();
    for (const card of cards) {
      map.set(card._id, card);
    }
    return map;
  }, [cards]);
}
