import { Bookmark, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeckSidebarItemContext } from "./context";

export function DeckSidebarItemCounts() {
  const { mainCount, sideCount, referenceCount } = useDeckSidebarItemContext();

  return (
    <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
      <div className="flex items-center gap-1 text-primary/80">
        <Layers className="h-3.5 w-3.5" />
        <span>{mainCount}</span>
      </div>

      {sideCount > 0 ? (
        <div className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{sideCount}</span>
        </div>
      ) : null}

      {referenceCount > 0 ? (
        <div className="flex items-center gap-1">
          <Bookmark className="h-3.5 w-3.5" />
          <span>{referenceCount}</span>
        </div>
      ) : null}

      <span
        className={cn(
          "ml-auto rounded border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider",
          mainCount >= 60
            ? "border-green-500/30 bg-green-500/10 text-green-500"
            : "border-orange-500/30 bg-orange-500/10 text-orange-500"
        )}
      >
        {mainCount >= 60 ? "Ready" : "Building"}
      </span>
    </div>
  );
}
