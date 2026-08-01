"use client";

import { useMemo } from "react";
import { CardDetailsDialog } from "@/components/universus/card-details/dialog";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { cn } from "@/lib/utils";
import { DeckDetailsHeroPanelProvider, useDeckDetailsHeroPanelContext } from "./context";
import { DeckDetailsHeroCharacterImagePicker } from "./character-image-picker";
import { DeckDetailsHeroReadyBadge } from "./ready-badge";
import { DeckDetailsHeroStaticImage } from "./static-image";
import { DeckDetailsHeroSymbolSelector } from "./symbol-selector";

function quantityTotal(quantities: Record<string, number> | undefined) {
  if (!quantities) return 0;
  return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
}

function DeckDetailsHeroPanelEmptyState({ compactMobile }: { compactMobile?: boolean }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[260px] shrink-0 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-secondary/10 lg:mx-0 lg:aspect-auto lg:h-64 lg:w-48",
        compactMobile ? "aspect-auto h-24 max-lg:max-w-none" : "aspect-[5/7]",
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
    imageCard,
    mainCount,
  } = useDeckDetailsHeroPanelContext();

  const isDeckEmpty = useMemo(() => {
    if (!deck) return true;
    return (
      mainCount +
        quantityTotal(deck.sideQuantities) +
        quantityTotal(deck.referenceQuantities) ===
      0
    );
  }, [deck, mainCount]);

  const hasHeroImage = Boolean(imageCard?.imageUrl || startingCharacter?.imageUrl);
  const compactEmptyMobile = isDeckEmpty && !hasHeroImage;

  if (!deck) {
    return <DeckDetailsHeroPanelEmptyState compactMobile />;
  }

  return (
    <>
      <div
        className={cn(
          "relative mx-auto w-full max-w-[260px] shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-card shadow-[0_0_0_1px_var(--primary)/15,0_0_8px_var(--primary)/30] lg:mx-0 lg:aspect-auto lg:h-64 lg:w-48",
          compactEmptyMobile ? "aspect-auto h-24 max-lg:max-w-none" : "aspect-[5/7]",
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
