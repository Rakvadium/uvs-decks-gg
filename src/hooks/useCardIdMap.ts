"use client";

import { useMemo } from "react";
import { useCardCatalog } from "@/lib/universus/card-data-provider";
import type { CachedCard } from "@/lib/universus/card-store";

/** `cards` by id, plus loaded cards outside the catalog (variant printings used by decks). */
export function useCardIdMap(cards: CachedCard[]) {
  const { extraCards } = useCardCatalog();
  return useMemo(() => {
    const map = new Map<string, CachedCard>();
    for (const card of extraCards.values()) {
      map.set(card._id, card);
    }
    for (const card of cards) {
      map.set(card._id, card);
    }
    return map;
  }, [cards, extraCards]);
}
