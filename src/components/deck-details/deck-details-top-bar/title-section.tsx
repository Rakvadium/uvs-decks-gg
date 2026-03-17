import { ChevronDown, Edit3, Globe, Loader2, Lock, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
    editIsPublic,
    setEditIsPublic,
    cancelEditing,
    isSaving,
    saveEdits,
    startEditing,
    isOwner,
  } = useDeckDetailsTopBarContext();

  if (!deck) return null;

  const displayIsPublic = isEditing ? editIsPublic : deck.isPublic;

  const handlePublicitySelect = (value: boolean) => {
    if (!isEditing) startEditing();
    setEditIsPublic(value);
  };

  const publicityBadge = (
    <Badge
      variant={displayIsPublic ? "default" : "outline"}
      className={cn(
        "hidden h-8 shrink-0 items-center gap-1.5 px-2.5 text-[9px] sm:inline-flex",
        isOwner && "cursor-pointer"
      )}
    >
      {displayIsPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {displayIsPublic ? "Public" : "Private"}
      {isOwner ? <ChevronDown className="h-3 w-3 opacity-70" /> : null}
    </Badge>
  );

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

      {isOwner ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 appearance-none border-0 bg-transparent p-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              {publicityBadge}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handlePublicitySelect(false)}>
              <Lock className="h-4 w-4" />
              Private
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePublicitySelect(true)}>
              <Globe className="h-4 w-4" />
              Public
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        publicityBadge
      )}

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
