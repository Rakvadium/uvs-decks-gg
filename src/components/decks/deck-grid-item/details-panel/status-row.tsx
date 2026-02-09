import { BookOpen, Bookmark, Layers, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeckGridItemContext } from "../context";

export function DeckGridItemStatusRow() {
  const { counts, isReady, showAuthor } = useDeckGridItemContext();

  return (
    <div className="flex items-center gap-2 border-t border-border/30 pt-2">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-1" title="Main Deck">
          <Layers className="h-3.5 w-3.5 text-primary/70 sm:h-4 sm:w-4" />
          <span className="font-mono text-xs font-bold text-foreground sm:text-sm">{counts.main}</span>
        </div>

        {counts.side > 0 ? (
          <div className="flex items-center gap-1 text-muted-foreground" title="Sideboard">
            <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="font-mono text-[10px] sm:text-[11px]">{counts.side}</span>
          </div>
        ) : null}

        {counts.reference > 0 ? (
          <div className="flex items-center gap-1 text-muted-foreground" title="Reference">
            <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="font-mono text-[10px] sm:text-[11px]">{counts.reference}</span>
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {showAuthor ? (
          <div className="flex items-center gap-1">
            <User className="h-2.5 w-2.5 text-muted-foreground/50 sm:h-3 sm:w-3" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50 sm:text-[10px]">
              User
            </span>
          </div>
        ) : null}

        <div
          className={cn(
            "flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider sm:px-2 sm:text-[10px]",
            isReady
              ? "border border-green-500/30 bg-green-500/10 text-green-500"
              : "border border-orange-500/30 bg-orange-500/10 text-orange-500"
          )}
        >
          {isReady ? "Ready" : "Building"}
        </div>
      </div>
    </div>
  );
}
