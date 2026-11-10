import { useCallback } from "react";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { useGameModule } from "@/games/game-context";
import { mainDeckTarget } from "@/games/main-deck-target";
import type { ClientDeckSetupPatch } from "@/games/types";
import { isDeckQuantitiesEmpty, quantityTotal } from "../deck-empty";

export function useDeckDetailsHeroPanelModel() {
  const { deck, isOwner, updateDeck } = useDeckDetails();
  const { cards: allCards } = useCardData();
  const cardIdMap = useCardIdMap(allCards);
  const gameModule = useGameModule();
  const setup = gameModule.deck.normalizeSetup(deck);

  const getCard = useCallback((id: string) => cardIdMap.get(id), [cardIdMap]);
  const onChange = useCallback(
    (patch: ClientDeckSetupPatch) => updateDeck({ setup: patch }),
    [updateDeck],
  );

  return {
    deck,
    isOwner,
    setup,
    getCard,
    onChange,
    coverCard: deck?.imageCardId ? cardIdMap.get(deck.imageCardId) ?? null : null,
    mainCount: quantityTotal(deck?.mainQuantities),
    readyTarget: mainDeckTarget(gameModule),
    isDeckEmpty: isDeckQuantitiesEmpty(deck),
  };
}
