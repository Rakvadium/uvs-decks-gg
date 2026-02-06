"use client";

import { motion } from "framer-motion";
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
              {group.cards.map((card, index) => {
                const quantity = model.currentQuantities[card._id.toString()] ?? 0;
                const backCard = card.backCardId ? model.cardIdMap.get(card.backCardId) : undefined;

                return (
                  <motion.div
                    key={card._id}
                    initial={model.prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                    animate={model.prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: model.prefersReducedMotion ? 0 : Math.min(index * 0.03, 0.4),
                    }}
                  >
                    <DeckCardStackItem card={card} quantity={quantity} backCard={backCard} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
