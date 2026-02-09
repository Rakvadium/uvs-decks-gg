import { LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAvailableGallerySidebarContext } from "./context";
import type { SidebarGalleryViewMode } from "./hook";

export function DeckDetailsGallerySidebarHeader() {
  const { gallery, viewMode, setViewMode } = useAvailableGallerySidebarContext();
  const { meta } = gallery;

  return (
    <div className="shrink-0 border-b border-border/40 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Gallery</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {meta.filteredCount.toLocaleString()} cards
            </span>
            {meta.activeFilterCount > 0 ? (
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                {meta.activeFilterCount} filter{meta.activeFilterCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/30 p-0.5">
          {(["card", "list"] as SidebarGalleryViewMode[]).map((mode) => {
            const Icon = mode === "card" ? LayoutGrid : List;
            const isActive = viewMode === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={
                  isActive
                    ? "flex items-center gap-1 rounded bg-primary/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary transition-colors"
                    : "flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {mode}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
