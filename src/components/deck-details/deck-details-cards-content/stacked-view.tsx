"use client";

import { Badge } from "@/components/ui/badge";
import { DeckCardStackItem } from "../deck-details-card-items";
import { useDeckCardsSectionContext } from "../deck-details-cards-section-context";

export function DeckCardsStackedView() {
  const model = useDeckCardsSectionContext();

  return (
    <div className="space-y-6">
      {model.groupedCards.map((group) => {
        const totalCount = group.cards.reduce((sum, card) => {
          return sum + (model.currentQuantities[card._id.toString()] ?? 0);
        }, 0);

        return (
          <div key={group.type} className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-bold uppercase tracking-[0.18em]">{group.label}</span>
                <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                  {totalCount}
                </Badge>
              </div>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-4 md:gap-1 lg:grid-cols-5 xl:grid-cols-6">
              {group.cards.map((card) => {
                const quantity = model.currentQuantities[card._id.toString()] ?? 0;
                const backCard = card.backCardId ? model.cardIdMap.get(card.backCardId) : undefined;

                return (
                  <div key={card._id} className="content-visibility-auto">
                    <DeckCardStackItem card={card} quantity={quantity} backCard={backCard} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
