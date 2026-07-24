"use client";

import { DeckFormatLegalityBadge } from "@/components/deck-details/deck-format-legality-badge";
import { DeckVisibilityBadgeMenu } from "@/components/deck-details/deck-visibility-badge-menu";
import { normalizeDeckVisibility, deckTeamSharingFromDeck } from "@/lib/deck/visibility";
import type { DeckTeamSharing, DeckVisibility } from "@/lib/deck/visibility";
import { useDeckDetailsTopBarContext } from "./deck-details-top-bar/context";

export function DeckDetailsMetaTags({ className }: { className?: string }) {
  const { deck, isLoading, isOwner, isAdmin, canSetTeamVisibility } = useDeckDetailsTopBarContext();

  if (isLoading || !deck) {
    return null;
  }

  const noopVis = (() => {}) as (value: DeckVisibility) => void;
  const noopTeam = (() => {}) as (mode: DeckTeamSharing) => void;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <DeckFormatLegalityBadge
          deckId={deck._id}
          formatKey={deck.format}
          subFormat={deck.subFormat}
          compact
          className="items-center"
        />
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
    </div>
  );
}
