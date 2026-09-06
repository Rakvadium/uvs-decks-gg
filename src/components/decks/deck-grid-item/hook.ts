import { useMemo } from "react";
import { normalizeDeckVisibility } from "@/lib/deck/visibility";
import { useProfanityDisplayText } from "@/lib/moderation/use-profanity-display-text";
import { useCardData } from "@/lib/universus/card-data-provider";
import type { DeckGridItemProps } from "./types";

export const MAIN_DECK_TARGET = 60;

function countSectionCards(quantities: Record<string, number>) {
  return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
}

function splitSymbols(symbols: string | undefined) {
  if (!symbols) return [] as string[];
  return symbols
    .split("|")
    .map((symbol) => symbol.trim().toLowerCase())
    .filter(Boolean);
}

export function useDeckGridItemModel({
  deck,
  showAuthor = false,
  coverImagePriority = false,
  selected = false,
  trailingAction,
}: DeckGridItemProps) {
  const { cards } = useCardData();
  const { display, viewerUserId } = useProfanityDisplayText();

  const imageCard = useMemo(() => {
    if (!deck.imageCardId) return null;
    return cards.find((card) => card._id === deck.imageCardId) ?? null;
  }, [deck.imageCardId, cards]);

  const startingCharacter = useMemo(() => {
    if (!deck.startingCharacterId) return null;
    return cards.find((card) => card._id === deck.startingCharacterId) ?? null;
  }, [deck.startingCharacterId, cards]);

  const counts = useMemo(
    () => ({
      main: countSectionCards(deck.mainQuantities),
      side: countSectionCards(deck.sideQuantities),
    }),
    [deck.mainQuantities, deck.sideQuantities],
  );

  const characterSymbols = useMemo(
    () => splitSymbols(startingCharacter?.symbols),
    [startingCharacter?.symbols],
  );

  const selectedSymbol = deck.selectedIdentity?.toLowerCase();
  const accentSymbol =
    selectedSymbol && characterSymbols.includes(selectedSymbol)
      ? selectedSymbol
      : (characterSymbols[0] ?? null);

  const isOwnDeck = viewerUserId != null && deck.userId === viewerUserId;
  const displayName = display(deck.name, isOwnDeck);
  const displayDescription = deck.description
    ? display(deck.description, isOwnDeck)
    : null;

  return {
    deck,
    showAuthor,
    coverImagePriority,
    selected,
    trailingAction,
    displayImage: imageCard?.imageUrl || startingCharacter?.imageUrl,
    startingCharacterName: startingCharacter?.name,
    characterHandSize: startingCharacter?.handSize ?? null,
    characterHealth: startingCharacter?.health ?? null,
    characterSymbols,
    accentSymbol,
    visibility: normalizeDeckVisibility(deck),
    authorLabel: deck.ownerUsername?.trim() || "Player",
    displayName,
    displayDescription,
    counts,
    progress: Math.min(1, counts.main / MAIN_DECK_TARGET),
    isReady: counts.main >= MAIN_DECK_TARGET,
  };
}

export type DeckGridItemModel = ReturnType<typeof useDeckGridItemModel>;
