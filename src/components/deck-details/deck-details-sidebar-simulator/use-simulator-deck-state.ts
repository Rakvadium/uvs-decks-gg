import { useMemo } from "react";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";

export function useSimulatorDeckState() {
  const context = useDeckDetailsOptional();
  const { cards } = useCardData();
  const cardMap = useCardIdMap(cards);

  const deck = context?.deck ?? null;
  const startingCharacter = deck?.startingCharacterId ? cardMap.get(deck.startingCharacterId) ?? null : null;
  const handSize = typeof startingCharacter?.handSize === "number" ? startingCharacter.handSize : 0;

  const mainDeckPool = useMemo(() => {
    if (!deck) return [] as string[];

    const pool: string[] = [];
    for (const [cardId, quantity] of Object.entries(deck.mainQuantities)) {
      for (let index = 0; index < quantity; index += 1) {
        pool.push(cardId);
      }
    }

    return pool;
  }, [deck]);

  const canDraw = handSize > 0 && mainDeckPool.length > 0;

  return {
    cardMap,
    startingCharacter,
    handSize,
    mainDeckPool,
    canDraw,
  };
}
