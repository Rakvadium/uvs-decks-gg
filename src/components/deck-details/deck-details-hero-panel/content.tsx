"use client";

import { CardDetailsDialog } from "@/components/universus/card-details/dialog";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { DeckDetailsHeroPanelProvider, useDeckDetailsHeroPanelContext } from "./context";
import { DeckDetailsHeroCharacterImagePicker } from "./character-image-picker";
import { DeckDetailsHeroReadyBadge } from "./ready-badge";
import { DeckDetailsHeroStaticImage } from "./static-image";
import { DeckDetailsHeroSymbolSelector } from "./symbol-selector";

function DeckDetailsHeroPanelEmptyState() {
  return (
    <div className="relative aspect-[5/7] w-full max-w-[260px] mx-auto shrink-0 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-secondary/10 lg:aspect-auto lg:h-64 lg:w-48 lg:mx-0" />
  );
}

function DeckDetailsHeroPanelContent() {
  const {
    characterDetailsOpen,
    setCharacterDetailsOpen,
    deck,
    isOwner,
    startingCharacter,
    startingCharacterBack,
  } = useDeckDetailsHeroPanelContext();

  if (!deck) {
    return <DeckDetailsHeroPanelEmptyState />;
  }

  return (
    <>
      <div className="relative aspect-[5/7] w-full max-w-[260px] mx-auto shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-card shadow-[0_0_0_1px_var(--primary)/15,0_0_8px_var(--primary)/30] lg:aspect-auto lg:h-64 lg:w-48 lg:mx-0">
        {isOwner ? (
          <>
            <DeckDetailsHeroCharacterImagePicker />
            <DeckDetailsHeroSymbolSelector />
          </>
        ) : (
          <DeckDetailsHeroStaticImage />
        )}
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
