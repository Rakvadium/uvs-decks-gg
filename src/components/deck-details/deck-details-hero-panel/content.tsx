"use client";

import { CardDetailsDialog } from "@/components/universus";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { DeckDetailsHeroPanelProvider, useDeckDetailsHeroPanelContext } from "./context";
import { DeckDetailsHeroCharacterImagePicker } from "./character-image-picker";
import { DeckDetailsHeroReadyBadge } from "./ready-badge";
import { DeckDetailsHeroSymbolSelector } from "./symbol-selector";

function DeckDetailsHeroPanelEmptyState() {
  return (
    <div className="relative aspect-[2.5/3.5] w-32 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-secondary/10 sm:w-40 lg:w-48" />
  );
}

function DeckDetailsHeroPanelContent() {
  const {
    characterDetailsOpen,
    setCharacterDetailsOpen,
    deck,
    startingCharacter,
    startingCharacterBack,
  } = useDeckDetailsHeroPanelContext();

  if (!deck) {
    return <DeckDetailsHeroPanelEmptyState />;
  }

  return (
    <>
      <div className="relative aspect-[2.5/3.5] w-32 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-secondary/10 sm:w-40 lg:w-48">
        <DeckDetailsHeroCharacterImagePicker />
        <DeckDetailsHeroSymbolSelector />
        <DeckDetailsHeroReadyBadge />
      </div>

      <CardDetailsDialog
        card={startingCharacter}
        backCard={startingCharacterBack}
        open={characterDetailsOpen}
        onOpenChange={setCharacterDetailsOpen}
      />
    </>
  );
}

export function DeckDetailsHeroPanel() {
  const { deck } = useDeckDetails();

  if (!deck) {
    return <DeckDetailsHeroPanelEmptyState />;
  }

  return (
    <DeckDetailsHeroPanelProvider>
      <DeckDetailsHeroPanelContent />
    </DeckDetailsHeroPanelProvider>
  );
}
