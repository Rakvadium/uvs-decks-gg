"use client";

import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { GalleryFilterDialogProvider } from "@/components/gallery/filter-dialog/context";
import { Button } from "@/components/ui/button";
import { galleryToolbarControlClassName } from "@/components/ui/gallery-search-field";
import { useIsMobile } from "@/hooks/useIsMobile";
import { FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryTopBarFiltersProvider } from "./context";
import { GalleryFilterControls, GalleryTopBarEndActions } from "./filter-controls";
import { FormatQuickFilter, GalleryQuickFiltersRow, SetQuickFilter } from "./gallery-quick-filters";
import { GallerySearchControls } from "./search-controls";

function GalleryTopBarFiltersContent() {
  const isMobile = useIsMobile();
  const filtersContext = useGalleryFiltersOptional();

  if (!filtersContext) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full items-center justify-center">
          <div className="flex w-full max-w-3xl items-center gap-2">
            <div className="min-w-0 flex-1">
              <GallerySearchControls />
            </div>
            <GalleryFilterControls />
          </div>
        </div>
        {filtersContext.meta.activeFilterCount > 0 ? (
          <div className="flex w-full items-center justify-center">
            <div className="flex w-full max-w-3xl justify-end">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  galleryToolbarControlClassName,
                  "gap-1.5 border-destructive/50 px-4 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
                )}
                onClick={filtersContext.actions.clearAllFilters}
              >
                <FilterX className="size-4 shrink-0" />
                Clear Filters
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <GalleryFilterDialogProvider filtersContext={filtersContext}>
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className="flex w-full min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <GallerySearchControls />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <FormatQuickFilter />
            <SetQuickFilter />
          </div>
          <GalleryTopBarEndActions placement="desktop-toolbar" />
        </div>
        <GalleryFilterControls />
        <GalleryQuickFiltersRow />
      </div>
    </GalleryFilterDialogProvider>
  );
}

export function GalleryTopBarFilters() {
  return (
    <GalleryTopBarFiltersProvider>
      <GalleryTopBarFiltersContent />
    </GalleryTopBarFiltersProvider>
  );
}
