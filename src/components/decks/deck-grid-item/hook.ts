import { useMemo } from "react";
import { normalizeDeckVisibility } from "@/lib/deck/visibility";
import { useProfanityDisplayText } from "@/lib/moderation/use-profanity-display-text";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useGameModule } from "@/games/game-context";
import { mainDeckTarget } from "@/games/main-deck-target";
import type { CachedCard } from "@/lib/universus/card-store";
import type { DeckGridItemProps } from "./types";
import { uvsSetupFields } from "@shared/games/uvs/setup";

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
  const gameModule = useGameModule();
  const gameDeck = gameModule.deck;
  const setup = gameDeck.normalizeSetup(deck);
  const mainTarget = mainDeckTarget(gameModule);

  const imageCard = useMemo(() => {
    if (!deck.imageCardId) return null;
    return cards.find((card) => card._id === deck.imageCardId) ?? null;
  }, [deck.imageCardId, cards]);

  const startingCharacter = useMemo(() => {
    const startingCharacterId = gameDeck.setupPreviewCardId(gameDeck.normalizeSetup(deck));
    if (!startingCharacterId) return null;
    return cards.find((card) => card._id === startingCharacterId) ?? null;
  }, [gameDeck, deck, cards]);

  // Every setup card (UVS: the starting character; Cyberpunk: the Legends), in setup order.
  const setupCards = useMemo(() => {
    const ids = gameDeck.setupCardIds(gameDeck.normalizeSetup(deck));
    return ids
      .map((id) => cards.find((card) => card._id === id))
      .filter((card): card is CachedCard => Boolean(card));
  }, [gameDeck, deck, cards]);

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

  const selectedSymbol = uvsSetupFields(setup).selectedIdentity?.toLowerCase();
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
    setup,
    /** Setup card names ("A · B · C"); UVS: the starting character's name. */
    startingCharacterName: setupCards.length > 0 ? setupCards.map((card) => card.name).join(" · ") : undefined,
    emptySetupLabel: gameModule.ui.deckSetup.emptySetupLabel,
    getSetupCard: (id: string) => setupCards.find((card) => card._id === id),
    characterHandSize: startingCharacter?.handSize ?? null,
    characterHealth: startingCharacter?.health ?? null,
    characterSymbols,
    accentSymbol,
    visibility: normalizeDeckVisibility(deck),
    authorLabel: deck.ownerUsername?.trim() || "Player",
    displayName,
    displayDescription,
    counts,
    mainTarget,
    progress: Math.min(1, counts.main / mainTarget),
    isReady: counts.main >= mainTarget,
  };
}

export type DeckGridItemModel = ReturnType<typeof useDeckGridItemModel>;
