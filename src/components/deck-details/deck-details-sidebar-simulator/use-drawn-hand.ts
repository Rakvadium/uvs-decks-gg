import { useCallback, useEffect, useMemo, useState } from "react";
import type { CachedCard } from "@/lib/universus/card-store";
import { SIMULATOR_REDRAW_EVENT } from "./constants";

interface UseDrawnHandParams {
  canDraw: boolean;
  handSize: number;
  mainDeckPool: string[];
  cardMap: Map<string, CachedCard>;
}

export function useDrawnHand({ canDraw, handSize, mainDeckPool, cardMap }: UseDrawnHandParams) {
  const [drawnCardIds, setDrawnCardIds] = useState<string[]>([]);

  const drawHand = useCallback(() => {
    if (!canDraw) {
      setDrawnCardIds([]);
      return;
    }

    const pool = [...mainDeckPool];
    const drawCount = Math.min(handSize, pool.length);
    const next: string[] = [];

    for (let index = 0; index < drawCount; index += 1) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      next.push(pool[randomIndex]);
      pool.splice(randomIndex, 1);
    }

    setDrawnCardIds(next);
  }, [canDraw, handSize, mainDeckPool]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRedraw = () => {
      drawHand();
    };

    window.addEventListener(SIMULATOR_REDRAW_EVENT, handleRedraw);

    return () => {
      window.removeEventListener(SIMULATOR_REDRAW_EVENT, handleRedraw);
    };
  }, [drawHand]);

  const drawnCards = useMemo(() => {
    if (!canDraw) return [];

    const entries: Array<{ key: string; card: CachedCard }> = [];

    for (const [index, cardId] of drawnCardIds.entries()) {
      const card = cardMap.get(cardId);
      if (!card) continue;

      entries.push({
        key: `${cardId}-${index}`,
        card,
      });
    }

    return entries;
  }, [canDraw, cardMap, drawnCardIds]);

  return {
    drawnCards,
    drawHand,
  };
}
