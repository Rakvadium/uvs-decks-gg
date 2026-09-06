"use client";

import { Check } from "lucide-react";
import { DeckGridItem } from "@/components/decks/deck-grid-item";
import { Button } from "@/components/ui/button";
import { DeckSidebarItemProvider, useDeckSidebarItemContext } from "./context";
import type { DeckData } from "../types";

function SetActiveToggle() {
  const { handleSetActive, isActive } = useDeckSidebarItemContext();

  return (
    <Button
      variant={isActive ? "secondary" : "outline"}
      size="sm"
      className="h-11 min-w-[5.5rem] px-3"
      onClick={handleSetActive}
    >
      {isActive ? <Check className="h-3.5 w-3.5" /> : null}
      {isActive ? "Active" : "Set Active"}
    </Button>
  );
}

function DeckSidebarItemContent() {
  const { deck, isActive, isOwner, showAuthor } = useDeckSidebarItemContext();

  return (
    <DeckGridItem
      deck={deck}
      design="row"
      selected={isActive}
      showAuthor={showAuthor}
      trailingAction={isOwner ? <SetActiveToggle /> : null}
    />
  );
}

export function DeckSidebarItem({ deck }: { deck: DeckData }) {
  return (
    <DeckSidebarItemProvider deck={deck}>
      <DeckSidebarItemContent />
    </DeckSidebarItemProvider>
  );
}
