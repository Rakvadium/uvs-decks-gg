import { useCallback } from "react";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useGameModule } from "@/games/game-context";
import type { ClientDeckSetupPatch } from "@/games/types";

export function useActiveDeckCharacterPanelModel() {
  const { activeDeck, updateDeck } = useActiveDeck();
  const { cards: allCards } = useCardData();
  const cardMap = useCardIdMap(allCards);
  const setup = useGameModule().deck.normalizeSetup(activeDeck);

  const getCard = useCallback((id: string) => cardMap.get(id), [cardMap]);
  const onChange = useCallback((patch: ClientDeckSetupPatch) => updateDeck({ setup: patch }), [updateDeck]);

  return { activeDeck, setup, getCard, onChange };
}
