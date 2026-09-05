"use client";

import { Zap } from "lucide-react";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { cn } from "@/lib/utils";
import { MobileNavBackButton, MobileNavIconButton } from "./nav-icon-button";
import { MobileNavTitle } from "./nav-title";

export function DeckDetailsSetActiveNavButton() {
  const context = useDeckDetailsOptional();
  const deck = context?.deck;
  const isOwner = Boolean(context?.isOwner && deck);
  const isActiveDeck = Boolean(context?.isActiveDeck);

  if (!isOwner || !context) return null;

  return (
    <MobileNavIconButton
      label={isActiveDeck ? "Active deck" : "Set as active deck"}
      active={isActiveDeck}
      disabled={isActiveDeck}
      onClick={context.setAsActiveDeck}
      className="disabled:opacity-100"
    >
      <Zap className={cn("size-5", isActiveDeck && "text-warning")} fill={isActiveDeck ? "currentColor" : "none"} />
    </MobileNavIconButton>
  );
}

export function DeckDetailsMobileNav() {
  const context = useDeckDetailsOptional();
  const deck = context?.deck;

  return (
    <>
      <div className="flex min-w-0 items-center justify-start">
        <MobileNavBackButton href="/decks" label="Decks" />
      </div>
      <MobileNavTitle>{deck?.name ?? (context?.isLoading ? "Loading…" : "Deck")}</MobileNavTitle>
      <div />
    </>
  );
}
