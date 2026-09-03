"use client";

import { CardDetailsDialog } from "@/components/universus/card-details/dialog";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { cn } from "@/lib/utils";
import { DeckDetailsHeroPanelProvider, useDeckDetailsHeroPanelContext } from "./context";
import { DeckDetailsHeroCharacterImagePicker } from "./character-image-picker";
import { DeckDetailsHeroReadyBadge } from "./ready-badge";
import { DeckDetailsHeroStaticImage } from "./static-image";
import { DeckDetailsHeroSymbolSelector } from "./symbol-selector";

function DeckDetailsHeroPanelEmptyState({ compactMobile }: { compactMobile?: boolean }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[260px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-card to-secondary/10 ring-1 ring-border/50 lg:mx-0 lg:w-48",
        compactMobile ? "aspect-auto h-24 max-lg:max-w-none" : "aspect-[2.5/3.5]",
      )}
    />
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
    compactEmptyMobile,
  } = useDeckDetailsHeroPanelContext();

  if (!deck) {
    return <DeckDetailsHeroPanelEmptyState compactMobile />;
  }

  return (
    <>
      <div
        className={cn(
          "relative mx-auto w-full max-w-[260px] shrink-0 overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--primary)/15,0_0_8px_var(--primary)/30] lg:mx-0 lg:w-48",
          compactEmptyMobile ? "aspect-auto h-24 max-lg:max-w-none" : "aspect-[2.5/3.5]",
        )}
      >
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
