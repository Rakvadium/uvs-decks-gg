import { Bookmark, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDeckSidebarItemContext } from "./context";

export function DeckSidebarItemCounts() {
  const { mainCount, sideCount, referenceCount } = useDeckSidebarItemContext();

  return (
    <div className="chrome-label-case flex items-center gap-3 text-[10px] text-muted-foreground">
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

      <Badge tone={mainCount >= 60 ? "success" : "warning"} className="ml-auto px-2 py-0.5 text-[10px]">
        {mainCount >= 60 ? "Ready" : "Building"}
      </Badge>
    </div>
  );
}
