import { useMemo, useState } from "react";
import { formatUniversusCardType } from "@/config/universus";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import type { Id } from "../../../../convex/_generated/dataModel";

export function useDeckDetailsHeroPanelModel() {
  const { deck, isOwner, updateDeck } = useDeckDetails();
  const { cards: allCards } = useCardData();
  const cardIdMap = useCardIdMap(allCards);

  const [characterOpen, setCharacterOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [characterDetailsOpen, setCharacterDetailsOpen] = useState(false);

  const startingCharacter = deck?.startingCharacterId ? cardIdMap.get(deck.startingCharacterId) ?? null : null;
  const startingCharacterBack = startingCharacter?.backCardId
    ? cardIdMap.get(startingCharacter.backCardId) ?? null
    : null;
  const imageCard = deck?.imageCardId ? cardIdMap.get(deck.imageCardId) ?? null : null;
  const selectedSymbol = deck?.selectedIdentity ? deck.selectedIdentity.toLowerCase() : null;

  const startingCharacterSymbols = startingCharacter?.symbols;
  const characterSymbols = useMemo(() => {
    if (!startingCharacterSymbols) return [];

    const rawSymbols = startingCharacterSymbols
      .split(/[,|]/)
      .map((symbol) => symbol.trim().toLowerCase())
      .filter(Boolean);

    return [...new Set(rawSymbols)];
  }, [startingCharacterSymbols]);

  const characterOptions = useMemo(
    () =>
      allCards
        .filter((card) => formatUniversusCardType(card.type) === "Character")
        .filter((card) => card.isFrontFace !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allCards]
  );

  const mainCount = useMemo(() => {
    if (!deck) return 0;
    return Object.values(deck.mainQuantities).reduce((sum, quantity) => sum + quantity, 0);
  }, [deck]);

  const handleSelectCharacter = async (characterId: Id<"cards">) => {
    await updateDeck({ startingCharacterId: characterId });
    setCharacterOpen(false);
  };

  const handleViewCharacterDetails = () => {
    setCharacterOpen(false);
    setCharacterDetailsOpen(true);
  };

  const handleSelectSymbol = (symbol: string) => {
    void updateDeck({ selectedIdentity: symbol });
    setSymbolOpen(false);
  };

  return {
    deck,
    isOwner,
    characterOpen,
    setCharacterOpen,
    symbolOpen,
    setSymbolOpen,
    characterDetailsOpen,
    setCharacterDetailsOpen,
    startingCharacter,
    startingCharacterBack,
    imageCard,
    selectedSymbol,
    characterSymbols,
    characterOptions,
    mainCount,
    handleSelectCharacter,
    handleViewCharacterDetails,
    handleSelectSymbol,
  };
}

export type DeckDetailsHeroPanelModel = ReturnType<typeof useDeckDetailsHeroPanelModel>;
