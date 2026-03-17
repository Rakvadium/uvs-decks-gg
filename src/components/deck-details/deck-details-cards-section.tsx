"use client";

import { AlertTriangle } from "lucide-react";
import { CardHoverPreviewPortal } from "@/components/deck/shared";
import { SIDEBAR_SIDEBOARD_LIMIT } from "./uvs-import-export";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";
import { DeckCardsToolbar } from "./deck-details-cards-toolbar";
import { DeckCardsContent } from "./deck-details-cards-content";

function DeckCardsSectionContent() {
  const model = useDeckCardsSectionContext();

  if (!model.deck) return null;

  return (
    <>
      <CardHoverPreviewPortal
        card={model.hoveredCard}
        rect={model.hoveredRect}
        prefersReducedMotion={model.prefersReducedMotion}
      />

      <div className="space-y-3">
        <DeckCardsToolbar />

        {model.isSideboardOverflow && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Sideboard has {model.counts.side} cards and exceeds the preferred limit of {SIDEBAR_SIDEBOARD_LIMIT}.
          </div>
        )}

        <DeckCardsContent />
      </div>
    </>
  );
}

export function DeckCardsSection() {
  return <DeckCardsSectionContent />;
}
