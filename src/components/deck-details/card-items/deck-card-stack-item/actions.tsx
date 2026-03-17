"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { useDeckCardsSectionContext } from "../../deck-details-cards-section-context";
import { useDeckSectionCounts } from "../hooks";
import type { CachedCard } from "@/lib/universus";

interface DeckCardStackItemActionsProps {
  card: CachedCard;
  quantity: number;
}

export function DeckCardStackItemActions({ card, quantity }: DeckCardStackItemActionsProps) {
  const deckDetails = useDeckDetailsOptional();
  const { activeSection } = useDeckCardsSectionContext();
  const { addCard, removeCard } = useDeckEditor();
  const sectionCounts = useDeckSectionCounts();

  if (!deckDetails?.isOwner) return null;

  const canAdd = canAddCardToSection({
    card,
    cardId: card._id,
    section: activeSection,
    counts: sectionCounts,
  });

  return (
    <div className="flex items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
      <Button
        variant="outline"
        size="icon-sm"
        className="h-7 w-7 border-primary/40 text-primary hover:bg-primary/15 hover:border-primary/60"
        onClick={() => removeCard(card._id, activeSection)}
        disabled={quantity <= 0}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        className="h-7 w-7 border-primary/40 text-primary hover:bg-primary/15 hover:border-primary/60"
        onClick={() => addCard(card._id, activeSection)}
        disabled={!canAdd}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
