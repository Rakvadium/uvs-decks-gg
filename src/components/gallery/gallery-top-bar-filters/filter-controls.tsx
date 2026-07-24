import { FilterX, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { GalleryFilterDialog } from "../gallery-filter-dialog";
import { useGalleryTopBarFiltersContext } from "./context";

export function GalleryTopBarEndActions() {
  const { meta, setFilterPanelOpen } = useGalleryTopBarFiltersContext();

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--control-dual-border)] bg-background/50 text-muted-foreground transition-colors hover:border-[color:var(--control-dual-border-strong)] hover:bg-[color:var(--control-dual-surface-hover)] hover:text-primary"
        aria-label="Open filter panel"
        onClick={() => setFilterPanelOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {meta.activeFilterCount > 0 ? (
          <Badge
            variant="secondary"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
          >
            {meta.activeFilterCount}
          </Badge>
        ) : null}
      </button>
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
          {meta.hasClearableFilters ? (
            <Button
              type="button"
              variant="destructiveOutline"
              size="icon-sm"
              className="size-9 shrink-0 rounded-md bg-background/50"
              aria-label="Clear all filters"
              onClick={actions.clearAllFilters}
            >
              <FilterX className="size-4 shrink-0" />
            </Button>
          ) : null}
          <GalleryTopBarEndActions />
        </div>
      ) : null}
      <GalleryFilterDialog open={isFilterPanelOpen} onOpenChange={setFilterPanelOpen} />
    </>
  );
}
