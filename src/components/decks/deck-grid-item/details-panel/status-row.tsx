import { BookOpen, Layers, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDeckGridItemContext } from "../context";

export function DeckGridItemStatusRow() {
  const { counts, isReady, showAuthor, deck } = useDeckGridItemContext();
  const authorLabel = deck.ownerUsername?.trim() || "Player";

  return (
    <div className="flex items-center gap-2 border-t border-border/30 pt-2">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-1" title="Main Deck">
          <Layers className="h-3.5 w-3.5 text-primary/70 sm:h-4 sm:w-4" />
          <span className="text-xs font-bold text-foreground sm:text-sm">{counts.main}</span>
        </div>

        {counts.side > 0 ? (
          <div className="flex items-center gap-1 text-muted-foreground" title="Sideboard">
            <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-[11px]">{counts.side}</span>
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {showAuthor ? (
          <div className="flex items-center gap-1">
            <User className="h-2.5 w-2.5 text-muted-foreground sm:h-3 sm:w-3" />
            <span className="chrome-label-case text-[10px] text-muted-foreground sm:text-[11px]">
              {authorLabel}
            </span>
          </div>
        ) : null}

        <Badge tone={isReady ? "success" : "warning"} className="px-1.5 py-0.5 text-[10px] sm:px-2">
          {isReady ? "Ready" : "Building"}
        </Badge>
      </div>
    </div>
  );
}
