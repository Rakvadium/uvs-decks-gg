"use client";

import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import { AppPageHeader } from "@/components/shell/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeckVisibilityBadgeMenu } from "@/components/deck-details/deck-visibility-badge-menu";
import { normalizeDeckVisibility, deckTeamSharingFromDeck } from "@/lib/deck/visibility";
import type { DeckTeamSharing, DeckVisibility } from "@/lib/deck/visibility";
import { useDeckDetailsTopBarContext } from "./deck-details-top-bar/context";
import { DeckDetailsTopBarViewActions } from "./deck-details-top-bar/view-actions";

export function DeckDetailsDesktopHeader() {
  const {
    deck,
    isLoading,
    isOwner,
    isAdmin,
    canSetTeamVisibility,
    startEditing,
  } = useDeckDetailsTopBarContext();

  if (isLoading || !deck) {
    return null;
  }

  const noopVis = (_value: DeckVisibility) => {};
  const noopTeam = (_mode: DeckTeamSharing) => {};

  const titleNode = (
    <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{deck.name}</h1>
  );

  const descriptionNode = (
    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
      {deck.description?.trim() ? deck.description : "No description yet."}
    </p>
  );

  const subRow = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" className="gap-2" asChild>
        <Link href="/decks">
          <ArrowLeft className="h-4 w-4" />
          All decks
        </Link>
      </Button>
      {deck.format ? (
        <Badge variant="cyber" className="h-8 items-center text-[9px]">
          {deck.format}
          {deck.subFormat ? ` / ${deck.subFormat}` : ""}
        </Badge>
      ) : null}
      <DeckVisibilityBadgeMenu
        deck={deck}
        isOwner={isOwner}
        readOnly={isOwner}
        isEditing={false}
        editVisibility={normalizeDeckVisibility(deck)}
        editTeamCollaboration={deckTeamSharingFromDeck(deck)}
        onSelect={noopVis}
        onSelectTeamSharing={noopTeam}
        canSetTournamentVisibility={isAdmin}
        canSetTeamVisibility={canSetTeamVisibility}
      />
    </div>
  );

  const actions = isOwner ? (
    <div className="flex flex-wrap items-center gap-2">
      <DeckDetailsTopBarViewActions />
      <Button variant="outline" size="sm" onClick={() => startEditing()}>
        <Edit3 className="h-4 w-4" />
        Edit
      </Button>
    </div>
  ) : null;

  return (
    <AppPageHeader
      title={titleNode}
      description={descriptionNode}
      tabs={subRow}
      actions={actions}
      secondaryRowFirst
    />
  );
}
