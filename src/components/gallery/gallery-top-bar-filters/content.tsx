"use client";

import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { GalleryFilterDialogProvider } from "@/components/gallery/filter-dialog/context";
import { useIsMobile } from "@/hooks/useIsMobile";
import { GalleryTopBarFiltersProvider } from "./context";
import { GalleryFilterControls } from "./filter-controls";
import { GalleryQuickFiltersRow } from "./gallery-quick-filters";
import { GallerySearchControls } from "./search-controls";

function GalleryTopBarFiltersContent() {
  const isMobile = useIsMobile();
  const filtersContext = useGalleryFiltersOptional();

  if (!filtersContext) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="flex w-full items-center justify-center">
        <div className="flex w-full max-w-3xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <GallerySearchControls />
          </div>
          <GalleryFilterControls />
        </div>
      </div>
    );
  }

  return (
    <GalleryFilterDialogProvider filtersContext={filtersContext}>
      <div className="flex w-full min-w-0 flex-col gap-2">
        <div className="flex w-full min-w-0 items-center gap-2 md:gap-3">
          <div className="min-w-0 flex-1">
            <GallerySearchControls />
          </div>
          <GalleryFilterControls />
        </div>
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
