"use client";

import { CardDeckControls } from "@/components/card/deck-controls";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useGameModule } from "@/games/game-context";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { useDeckCardsSectionContext } from "../../deck-details-cards-section-context";
import { useDeckSectionCounts } from "../hooks";
import type { CachedCard } from "@/lib/universus/card-store";

interface DeckCardStackItemActionsProps {
  card: CachedCard;
  quantity: number;
  isHovered: boolean;
}

export function DeckCardStackItemActions({ card, quantity, isHovered }: DeckCardStackItemActionsProps) {
  const deckDetails = useDeckDetailsOptional();
  const { activeSection } = useDeckCardsSectionContext();
  const { addCard, removeCard } = useDeckEditor();
  const sectionCounts = useDeckSectionCounts();
  const gameDeck = useGameModule().deck;

  if (deckDetails?.isOwner !== true) {
    return (
      <CardDeckControls
        deckCount={quantity}
        isHovered={false}
        canAdd={false}
        forceSolidSurface
        readOnly
      />
    );
  }

  const canAdd = canAddCardToSection({
    card,
    cardId: card._id,
    section: activeSection,
    counts: sectionCounts,
    rules: gameDeck,
  });

  return (
    <CardDeckControls
      deckCount={quantity}
      isHovered={isHovered}
      canAdd={canAdd}
      forceSolidSurface
      onAdd={(e) => { e.stopPropagation(); addCard(card._id, activeSection); }}
      onRemove={(e) => { e.stopPropagation(); removeCard(card._id, activeSection); }}
    />
  );
}
