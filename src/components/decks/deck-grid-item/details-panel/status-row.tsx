import { BookOpen, Bookmark, Layers, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeckGridItemContext } from "../context";

export function DeckGridItemStatusRow() {
  const { counts, isReady, showAuthor } = useDeckGridItemContext();

  return (
    <div className="flex items-center gap-2 border-t border-border/30 pt-2.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1" title="Main Deck">
          <Layers className="h-4 w-4 text-primary/70" />
          <span className="font-mono text-sm font-bold text-foreground">{counts.main}</span>
        </div>

        {counts.side > 0 ? (
          <div className="flex items-center gap-1 text-muted-foreground" title="Sideboard">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="font-mono text-[11px]">{counts.side}</span>
          </div>
        ) : null}

        {counts.reference > 0 ? (
          <div className="flex items-center gap-1 text-muted-foreground" title="Reference">
            <Bookmark className="h-3.5 w-3.5" />
            <span className="font-mono text-[11px]">{counts.reference}</span>
          </div>
        ) : null}
      </div>

      {showAuthor ? (
        <div className="ml-auto flex items-center gap-1">
          <User className="h-3 w-3 text-muted-foreground/50" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">User</span>
        </div>
      ) : null}

      <div
        className={cn(
          "ml-auto flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
          isReady
            ? "border border-green-500/30 bg-green-500/10 text-green-500"
            : "border border-orange-500/30 bg-orange-500/10 text-orange-500"
        )}
      >
        {isReady ? "Ready" : "Building"}
      </div>
    </div>
  );
}
