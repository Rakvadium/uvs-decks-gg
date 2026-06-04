"use client";

import { DeckFormatLegalityBadge } from "@/components/deck-details/deck-format-legality-badge";
import { DeckVisibilityBadgeMenu } from "@/components/deck-details/deck-visibility-badge-menu";
import type { DeckTeamSharing, DeckVisibility } from "@/lib/deck/visibility";
import { normalizeDeckVisibility, deckTeamSharingFromDeck } from "@/lib/deck/visibility";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

export function DeckDetailsMetaPanel() {
  const {
    deck,
    isOwner,
    isAdmin,
    canSetTeamVisibility,
  } = useDeckDetails();

  const noopVis = (_value: DeckVisibility) => {};
  const noopTeam = (_mode: DeckTeamSharing) => {};

  if (!deck) return null;

  return (
    <section className="min-w-0 flex-1 rounded-xl border border-border/50 bg-card/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="space-y-3">
        <div className="space-y-2">
          <h1 className="line-clamp-2 text-lg font-display font-bold uppercase tracking-[0.16em] sm:text-xl" title={deck.name}>
            {deck.name}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
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
              className="text-[10px]"
            />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {deck.description?.trim() ? deck.description : "No description yet."}
        </p>
      </div>
    </section>
  );
}
