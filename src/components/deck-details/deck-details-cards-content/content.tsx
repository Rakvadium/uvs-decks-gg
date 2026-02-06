"use client";

import { DECK_SECTION_CONFIG as SECTION_CONFIG } from "@/lib/deck/display-config";
import { cn } from "@/lib/utils";
import { useDeckCardsSectionContext } from "../deck-details-cards-section-context";
import { DeckCardsEmptyState } from "./empty-state";
import { DeckCardsListView } from "./list-view";
import { DeckCardsStackedView } from "./stacked-view";

export function DeckCardsContent() {
  const model = useDeckCardsSectionContext();

  return (
    <div
      className={cn(
        "rounded-xl transition-colors",
        model.canDropToActiveSection && "ring-1 ring-primary/40",
        model.isDeckDropOver && "bg-primary/5 ring-primary/60"
      )}
      {...model.deckDropProps}
    >
      {model.canDropToActiveSection && (
        <div className="rounded-t-xl border-b border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-primary">
          {model.isDeckDropOver
            ? `Release to add to ${SECTION_CONFIG[model.activeSection].label}`
            : `Drag card here to add to ${SECTION_CONFIG[model.activeSection].label}`}
        </div>
      )}

      <div className="p-1">
        {model.visibleCards.length === 0 ? (
          <DeckCardsEmptyState />
        ) : model.viewMode === "stacked" ? (
          <DeckCardsStackedView />
        ) : (
          <DeckCardsListView />
        )}
      </div>
    </div>
  );
}
