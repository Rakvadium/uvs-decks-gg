"use client";

import { useState } from "react";
import { DeckFormatLegalityBadge } from "@/components/deck-details/deck-format-legality-badge";
import { DeckVisibilityBadgeMenu } from "@/components/deck-details/deck-visibility-badge-menu";
import type { DeckTeamSharing, DeckVisibility } from "@/lib/deck/visibility";
import { normalizeDeckVisibility, deckTeamSharingFromDeck } from "@/lib/deck/visibility";
import { cn } from "@/lib/utils";
import { useDeckDetailsTopBarContext } from "./context";

interface DeckDetailsTopBarTitleSectionProps {
  compact?: boolean;
}

export function DeckDetailsTopBarTitleSection({ compact = false }: DeckDetailsTopBarTitleSectionProps) {
  const {
    deck,
    isOwner,
    isAdmin,
    canSetTeamVisibility,
  } = useDeckDetailsTopBarContext();
  const [titleExpanded, setTitleExpanded] = useState(false);

  if (!deck) return null;

  const noopTeam = (_mode: DeckTeamSharing) => {};

  const noopVis = (_value: DeckVisibility) => {};

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col", compact ? "gap-1" : "gap-1.5")}>
      <h1 className="min-w-0">
        <button
          type="button"
          className={cn(
            "block w-full min-w-0 text-left font-display text-sm font-bold uppercase tracking-[0.18em]",
            "rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            titleExpanded ? "whitespace-normal break-words" : "truncate",
          )}
          title={deck.name}
          aria-expanded={titleExpanded}
          aria-label={titleExpanded ? `Collapse deck name: ${deck.name}` : `Expand deck name: ${deck.name}`}
          onClick={() => setTitleExpanded((open) => !open)}
        >
          {deck.name}
        </button>
      </h1>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <DeckVisibilityBadgeMenu
          deck={deck}
          isOwner={isOwner}
          readOnly={isOwner}
          isEditing={false}
          editVisibility={normalizeDeckVisibility(deck)}
          editTeamCollaboration={deckTeamSharingFromDeck(deck)}
          onSelect={noopVis}
          onSelectTeamSharing={noopTeam}
          compact
          canSetTournamentVisibility={isAdmin}
          canSetTeamVisibility={canSetTeamVisibility}
        />

        <DeckFormatLegalityBadge
          deckId={deck._id}
          formatKey={deck.format}
          subFormat={deck.subFormat}
          compact
          className="inline-flex shrink-0 items-center"
        />
      </div>
    </div>
  );
}
