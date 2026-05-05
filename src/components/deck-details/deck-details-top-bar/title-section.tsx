import { Badge } from "@/components/ui/badge";
import { DeckVisibilityBadgeMenu } from "@/components/deck-details/deck-visibility-badge-menu";
import type { DeckTeamSharing, DeckVisibility } from "@/lib/deck/visibility";
import { normalizeDeckVisibility, deckTeamSharingFromDeck } from "@/lib/deck/visibility";
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

  if (!deck) return null;

  const noopTeam = (_mode: DeckTeamSharing) => {};

  const noopVis = (_value: DeckVisibility) => {};

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <h1 className="truncate font-display text-sm font-bold uppercase tracking-[0.2em]" title={deck.name}>
        {deck.name}
      </h1>

      <span className="hidden sm:contents">
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
      </span>

      {deck.format ? (
        <Badge variant="cyber" className="hidden h-8 shrink-0 items-center text-[9px] md:inline-flex">
          {deck.format}
          {deck.subFormat ? ` / ${deck.subFormat}` : ""}
        </Badge>
      ) : null}
    </div>
  );
}
