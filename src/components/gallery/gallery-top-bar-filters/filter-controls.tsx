import { FilterX, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { galleryToolbarControlClassName } from "@/components/ui/gallery-search-field";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { GalleryFilterDialog } from "../gallery-filter-dialog";
import { useGalleryTopBarFiltersContext } from "./context";
import { GalleryViewModePopover } from "./view-mode-popover";

export type GalleryTopBarEndActionsPlacement = "mobile-toolbar" | "desktop-toolbar";

export function GalleryTopBarEndActions({ placement }: { placement: GalleryTopBarEndActionsPlacement }) {
  const { meta, setFilterPanelOpen } = useGalleryTopBarFiltersContext();
  const isMobileToolbar = placement === "mobile-toolbar";
  const isDesktopToolbar = placement === "desktop-toolbar";

  return (
    <div
      className={cn("flex shrink-0 items-center", isMobileToolbar ? "gap-1.5" : "gap-2")}
    >
      {isDesktopToolbar ? <GalleryViewModePopover triggerStyle="labeled" /> : null}

      {isDesktopToolbar ? (
        <Button
          type="button"
          variant="outline"
          className={cn(galleryToolbarControlClassName, "shrink-0 gap-1.5 px-4")}
          aria-label="Open filter panel"
          onClick={() => setFilterPanelOpen(true)}
        >
          <SlidersHorizontal className="size-4 shrink-0" />
          <span>Show filters</span>
          {meta.activeFilterCount > 0 ? (
            <Badge
              variant="secondary"
              className="h-4 min-w-4 shrink-0 px-1 text-[9px] tabular-nums"
            >
              {meta.activeFilterCount}
            </Badge>
          ) : null}
        </Button>
      ) : (
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
      )}
    </div>
  );
}

export function GalleryFilterControls() {
  const { isFilterPanelOpen, setFilterPanelOpen, meta, actions } = useGalleryTopBarFiltersContext();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {meta.activeFilterCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className={cn(
                "size-9 shrink-0 border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
              )}
              aria-label="Clear all filters"
              onClick={actions.clearAllFilters}
            >
              <FilterX className="size-4 shrink-0" />
            </Button>
          ) : null}
          <GalleryTopBarEndActions placement="mobile-toolbar" />
        </div>
      ) : null}
      <GalleryFilterDialog open={isFilterPanelOpen} onOpenChange={setFilterPanelOpen} />
    </>
  );
}
