import { Edit3, Loader2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeckVisibilityBadgeMenu } from "@/components/deck-details/deck-visibility-badge-menu";
import { cn } from "@/lib/utils";
import type { DeckTeamSharing, DeckVisibility } from "@/lib/deck/visibility";
import { useDeckDetailsTopBarContext } from "./context";

interface DeckDetailsTopBarTitleSectionProps {
  compact?: boolean;
}

export function DeckDetailsTopBarTitleSection({ compact = false }: DeckDetailsTopBarTitleSectionProps) {
  const {
    deck,
    isEditing,
    editName,
    setEditName,
    editVisibility,
    setEditVisibility,
    editTeamCollaboration,
    setEditTeamCollaboration,
    cancelEditing,
    isSaving,
    saveEdits,
    startEditing,
    isOwner,
    isAdmin,
    canSetTeamVisibility,
  } = useDeckDetailsTopBarContext();

  if (!deck) return null;

  const handleVisibilitySelect = (value: DeckVisibility) => {
    if (!isEditing) startEditing();
    setEditVisibility(value);
  };

  const handleTeamSharingSelect = (mode: DeckTeamSharing) => {
    if (!isEditing) startEditing();
    setEditVisibility("team");
    setEditTeamCollaboration(mode);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {isEditing ? (
        <Input
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
          className={cn(
            "h-8 min-w-0 shrink font-display text-sm font-bold uppercase tracking-wide",
            compact ? "max-w-24" : "max-w-48 flex-1 sm:max-w-sm"
          )}
          placeholder="Deck name..."
        />
      ) : (
        <h1 className="truncate font-display text-sm font-bold uppercase tracking-[0.2em]" title={deck.name}>
          {deck.name}
        </h1>
      )}

      {isOwner ? (
        isEditing ? (
          <>
            <Button
              size={compact ? "icon" : "sm"}
              onClick={() => void saveEdits()}
              disabled={isSaving}
              className={cn("h-8 shrink-0", compact && "w-8")}
              aria-label="Save deck edits"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size={compact ? "icon" : "sm"}
            onClick={startEditing}
            className={cn("h-8 shrink-0", compact && "w-8")}
            aria-label="Edit deck"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        )
      ) : null}

      <span className="hidden sm:contents">
        <DeckVisibilityBadgeMenu
          deck={deck}
          isOwner={isOwner}
          isEditing={isEditing}
          editVisibility={editVisibility}
          editTeamCollaboration={editTeamCollaboration}
          onSelect={handleVisibilitySelect}
          onSelectTeamSharing={handleTeamSharingSelect}
          compact
          canSetTournamentVisibility={isAdmin}
          canSetTeamVisibility={canSetTeamVisibility}
        />
      </span>

      {isOwner && isEditing ? (
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          onClick={cancelEditing}
          className={cn("h-8 shrink-0", compact && "w-8")}
          aria-label="Cancel deck edits"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}

      {deck.format ? (
        <Badge variant="cyber" className="hidden h-8 shrink-0 items-center text-[9px] md:inline-flex">
          {deck.format}
          {deck.subFormat ? ` / ${deck.subFormat}` : ""}
        </Badge>
      ) : null}
    </div>
  );
}
