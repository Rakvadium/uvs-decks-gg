"use client";

import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { cn } from "@/lib/utils";
import { useGameModule } from "@/games/game-context";
import { useDeckDetailsHeroPanelModel } from "./hook";
import { DeckDetailsHeroReadyBadge } from "./ready-badge";

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

/** Deck setup in the deck details side column, rendered by the game module (`ui.DeckSetupPanel`). */
function DeckDetailsHeroPanelContent() {
  const { DeckSetupPanel } = useGameModule().ui;
  const { deck, isOwner, setup, getCard, onChange, coverCard, mainCount, readyTarget, isDeckEmpty } =
    useDeckDetailsHeroPanelModel();

  if (!deck) {
    return <DeckDetailsHeroPanelEmptyState compactMobile />;
  }

  return (
    <DeckSetupPanel
      variant="hero"
      setup={setup}
      getCard={getCard}
      onChange={isOwner ? onChange : undefined}
      readOnly={!isOwner}
      mainQuantities={deck.mainQuantities}
      coverCard={coverCard}
      deckName={deck.name}
      deckDescription={deck.description}
      deckEmpty={isDeckEmpty}
      overlay={<DeckDetailsHeroReadyBadge mainCount={mainCount} target={readyTarget} />}
    />
  );
}

export function DeckDetailsHeroPanel() {
  const { deck } = useDeckDetails();

  if (!deck) {
    return <DeckDetailsHeroPanelEmptyState />;
  }

  return <DeckDetailsHeroPanelContent />;
}
