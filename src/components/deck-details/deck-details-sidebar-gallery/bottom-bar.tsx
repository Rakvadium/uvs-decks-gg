import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { ViewModeOptions } from "@/components/gallery/gallery-top-bar-filters/view-mode-popover";
import { CountBadge } from "@/components/ui/count-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAvailableGallerySidebarContext } from "./context";

const SIDEBAR_VIEW_MODES = ["card", "list"] as const;

const sidebarToolClassName =
  "relative flex size-(--control-h-md) shrink-0 items-center justify-center rounded-control border border-primary-soft bg-background-soft text-muted-foreground outline-none transition-colors hover:border-primary-strong hover:bg-(--hover-bg) hover:text-primary focus-visible:ring-2 focus-visible:ring-ring";

export function DeckDetailsGallerySidebarBottomBar() {
  const { gallery, setIsFilterDialogOpen, viewMode, setViewMode } = useAvailableGallerySidebarContext();
  const CurrentViewIcon = viewMode === "card" ? LayoutGrid : List;
  const { state, actions, meta } = gallery;

  return (
    <div className="z-20 shrink-0 border-b border-border/40 bg-background/95 px-3 py-3 backdrop-blur-lg">
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
            className="border-primary-soft pl-9 text-sm shadow-[0_0_10px_-3px_var(--primary)] focus-visible:border-primary focus-visible:shadow-[0_0_15px_-3px_var(--primary)]"
            name="deck-sidebar-gallery-search"
            spellCheck={false}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={sidebarToolClassName} aria-label="Change view mode">
              <CurrentViewIcon className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="end">
            <div className="space-y-3">
              <span className="chrome-label-case text-xs text-muted-foreground">View Mode</span>
              <ViewModeOptions modes={SIDEBAR_VIEW_MODES} value={viewMode} onValueChange={setViewMode} />
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="button"
          className={sidebarToolClassName}
          aria-label="Open filter panel"
          onClick={() => setIsFilterDialogOpen(true)}
        >
          <SlidersHorizontal className="size-4" />
          {meta.activeFilterCount > 0 ? (
            <CountBadge count={meta.activeFilterCount} className="absolute -right-1 -top-1" />
          ) : null}
        </button>

        {meta.hasClearableFilters ? (
          <Button
            type="button"
            variant="destructiveOutline"
            size="icon"
            className="shrink-0 bg-background/50"
            onClick={actions.clearAllFilters}
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4 shrink-0" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
