"use client";

import { useEffect } from "react";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { GalleryFilterDialogProvider } from "@/components/gallery/filter-dialog/context";
import { useIsMobile } from "@/hooks/useIsMobile";
import { GalleryTopBarFiltersProvider } from "./context";
import { GalleryFilterControls, GalleryTopBarEndActions } from "./filter-controls";
import { FormatQuickFilter, GalleryQuickFiltersRow, SetQuickFilter } from "./gallery-quick-filters";
import { GallerySearchControls } from "./search-controls";

function GalleryTopBarFiltersContent() {
  const isMobile = useIsMobile();
  const filtersContext = useGalleryFiltersOptional();

  useEffect(() => {
    if (!filtersContext || !isMobile) return;
    if (filtersContext.state.viewMode === "details") {
      filtersContext.actions.setViewMode("list");
    }
  }, [filtersContext, isMobile]);

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
