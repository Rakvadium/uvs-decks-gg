import { useMemo } from "react";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { useGameModule } from "@/games/game-context";

export function useSimulatorDeckState() {
  const context = useDeckDetailsOptional();
  const { cards } = useCardData();
  const cardMap = useCardIdMap(cards);
  const gameDeck = useGameModule().deck;

  const deck = context?.deck ?? null;
  const setup = gameDeck.normalizeSetup(deck);
  const previewCardId = gameDeck.setupPreviewCardId(setup);
  const startingCharacter = previewCardId ? cardMap.get(previewCardId) ?? null : null;
  const handSize = gameDeck.simulatorHandSize(setup, (id) => cardMap.get(id));

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
