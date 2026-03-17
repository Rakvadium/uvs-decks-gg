import { Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAvailableGallerySidebarContext } from "./context";
import { DeckDetailsGalleryViewModePopover } from "./view-mode-popover";

interface DeckDetailsGallerySidebarBottomBarProps {
  position?: "top" | "bottom";
}

export function DeckDetailsGallerySidebarBottomBar({ position = "bottom" }: DeckDetailsGallerySidebarBottomBarProps) {
  const { gallery, setIsFilterDialogOpen } = useAvailableGallerySidebarContext();
  const { state, actions, meta } = gallery;

  return (
    <div
      className={cn(
        "z-20 shrink-0 bg-background/95 px-3 py-3 backdrop-blur-lg",
        position === "top" ? "border-b border-border/40" : "sticky bottom-0 border-t border-border/40"
      )}
    >
      <div className="flex w-full items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
          <Input
            placeholder={
              state.searchMode === "name"
                ? "Search by name…"
                : state.searchMode === "text"
                  ? "Search card text…"
                  : "Search all fields…"
            }
            value={state.search}
            onChange={(event) => actions.setSearch(event.target.value)}
            className="h-9 border-primary/40 bg-background/50 pl-9 text-sm shadow-[0_0_10px_-3px_var(--primary)] focus-visible:border-primary focus-visible:shadow-[0_0_15px_-3px_var(--primary)]"
            name="deck-sidebar-gallery-search"
            spellCheck={false}
          />
        </div>

        <DeckDetailsGalleryViewModePopover />

        <button
          type="button"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-background/60 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
          aria-label="Open filter panel"
          onClick={() => setIsFilterDialogOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {meta.activeFilterCount > 0 ? (
            <Badge
              variant="secondary"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[9px]"
            >
              {meta.activeFilterCount}
            </Badge>
          ) : null}
        </button>

        {meta.activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={actions.clearAllFilters}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-background/60 text-primary transition-colors hover:border-primary/60 hover:bg-primary/15"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
