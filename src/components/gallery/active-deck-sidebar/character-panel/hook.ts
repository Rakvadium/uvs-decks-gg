import { useMemo, useState } from "react";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useGameModule } from "@/games/game-context";
import type { Id } from "../../../../../convex/_generated/dataModel";

export function useActiveDeckCharacterPanelModel() {
  const { activeDeck, updateDeck } = useActiveDeck();
  const { cards: allCards } = useCardData();
  const cardMap = useCardIdMap(allCards);
  const setup = useGameModule().deck.normalizeSetup(activeDeck);

  const [characterOpen, setCharacterOpen] = useState(false);
  const [characterDetailsOpen, setCharacterDetailsOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);

  const startingCharacterId = setup.startingCharacterId;
  const startingCharacter = startingCharacterId ? cardMap.get(startingCharacterId) ?? null : null;
  const startingCharacterBack = startingCharacter?.backCardId
    ? cardMap.get(startingCharacter.backCardId) ?? null
    : null;

  const selectedSymbol = setup.selectedIdentity?.toLowerCase() ?? null;
  const startingCharacterSymbols = startingCharacter?.symbols;

  const characterSymbols = useMemo(() => {
    if (!startingCharacterSymbols) return [];

    return [
      ...new Set(
        startingCharacterSymbols
          .split(/[,|]/)
          .map((symbol) => symbol.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];
  }, [startingCharacterSymbols]);

  const handleSelectCharacter = async (cardId: Id<"cards">) => {
    await updateDeck({ setup: { game: setup.game, startingCharacterId: cardId } });
  };

  const handleSelectSymbol = (symbol: string) => {
    updateDeck({ setup: { game: setup.game, selectedIdentity: symbol } });
    setSymbolOpen(false);
  };

  const handleImageClick = () => {
    if (startingCharacter) {
      setCharacterDetailsOpen(true);
    }
  };

  return {
    activeDeck,
    setup,
    characterOpen,
    setCharacterOpen,
    characterDetailsOpen,
    setCharacterDetailsOpen,
    symbolOpen,
    setSymbolOpen,
    startingCharacter,
    startingCharacterBack,
    selectedSymbol,
    characterSymbols,
    handleSelectCharacter,
    handleSelectSymbol,
    handleImageClick,
  };
}

export type ActiveDeckCharacterPanelModel = ReturnType<typeof useActiveDeckCharacterPanelModel>;
