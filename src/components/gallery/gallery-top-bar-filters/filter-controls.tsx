import { SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GalleryFilterDialog } from "../gallery-filter-dialog";
import { useGalleryTopBarFiltersContext } from "./context";
import { GalleryViewModePopover } from "./view-mode-popover";

export function GalleryFilterControls() {
  const { meta, actions, isFilterPanelOpen, setFilterPanelOpen } = useGalleryTopBarFiltersContext();

  return (
    <>
      <div className="absolute bottom-[1px] right-[1px] top-[1px] flex items-stretch">
        <div className="flex items-center justify-center px-1.5">
          <GalleryViewModePopover />
        </div>

        <div className="flex items-center justify-center px-1.5">
          <button
            type="button"
            className="relative flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
        </div>

        {meta.activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={actions.clearAllFilters}
            className="flex items-center justify-center rounded-r-md bg-primary/10 px-2.5 text-primary transition-colors hover:bg-primary/20"
            aria-label="Clear all filters"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <GalleryFilterDialog open={isFilterPanelOpen} onOpenChange={setFilterPanelOpen} />
    </>
  );
}
