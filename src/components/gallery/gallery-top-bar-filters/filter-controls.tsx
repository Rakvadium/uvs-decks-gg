import { SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/useIsMobile";
import { GalleryFilterDialog } from "../gallery-filter-dialog";
import { useGalleryTopBarFiltersContext } from "./context";
import { GalleryViewModePopover } from "./view-mode-popover";

export function GalleryFilterControls() {
  const { meta, actions, isFilterPanelOpen, setFilterPanelOpen } = useGalleryTopBarFiltersContext();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <GalleryViewModePopover />

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-background/60 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
            aria-label="Open filter panel"
            onClick={() => setFilterPanelOpen(true)}
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
              className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-background/60 text-primary transition-colors hover:border-primary/60 hover:bg-primary/15"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <GalleryViewModePopover />

          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
            aria-label="Open filter panel"
            onClick={() => setFilterPanelOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {meta.activeFilterCount > 0 ? (
              <Badge
                variant="secondary"
                className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center px-0.5 text-[9px]"
              >
                {meta.activeFilterCount}
              </Badge>
            ) : null}
          </button>

          {meta.activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={actions.clearAllFilters}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/60 text-primary transition-colors hover:border-primary/40 hover:bg-primary/10"
              aria-label="Clear all filters"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      )}

      <GalleryFilterDialog open={isFilterPanelOpen} onOpenChange={setFilterPanelOpen} />
    </>
  );
}
