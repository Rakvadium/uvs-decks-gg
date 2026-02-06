import { useMemo, useState } from "react";
import { formatUniversusCardType } from "@/config/universus";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import type { Id } from "../../../../../convex/_generated/dataModel";

export function useActiveDeckCharacterPanelModel() {
  const { activeDeck, updateDeck } = useActiveDeck();
  const { cards: allCards } = useCardData();
  const cardMap = useCardIdMap(allCards);

  const [characterOpen, setCharacterOpen] = useState(false);
  const [characterDetailsOpen, setCharacterDetailsOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);

  const startingCharacterId = activeDeck?.startingCharacterId;
  const startingCharacter = startingCharacterId ? cardMap.get(startingCharacterId) ?? null : null;
  const startingCharacterBack = startingCharacter?.backCardId
    ? cardMap.get(startingCharacter.backCardId) ?? null
    : null;

  const selectedSymbol = activeDeck?.selectedIdentity?.toLowerCase() ?? null;
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

  const characterOptions = useMemo(
    () =>
      allCards
        .filter((card) => formatUniversusCardType(card.type) === "Character")
        .filter((card) => card.isFrontFace !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allCards]
  );

  const handleSelectCharacter = async (cardId: Id<"cards">) => {
    await updateDeck({ startingCharacterId: cardId });
    setCharacterOpen(false);
  };

  const handleViewCharacterDetails = () => {
    setCharacterOpen(false);
    setCharacterDetailsOpen(true);
  };

  const handleSelectSymbol = (symbol: string) => {
    updateDeck({ selectedIdentity: symbol });
    setSymbolOpen(false);
  };

  return {
    activeDeck,
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
    characterOptions,
    handleSelectCharacter,
    handleViewCharacterDetails,
    handleSelectSymbol,
  };
}

export type ActiveDeckCharacterPanelModel = ReturnType<typeof useActiveDeckCharacterPanelModel>;
