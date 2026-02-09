"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { GalleryTopBarFiltersProvider } from "./context";
import { GalleryFilterControls } from "./filter-controls";
import { GallerySearchControls } from "./search-controls";

function GalleryTopBarFiltersContent() {
  const isMobile = useIsMobile();

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
    <div className="flex w-full items-center justify-center">
      <div className="relative flex w-full max-w-xl items-center">
        <GallerySearchControls />
        <GalleryFilterControls />
      </div>
    </div>
  );
}

export function GalleryTopBarFilters() {
  return (
    <GalleryTopBarFiltersProvider>
      <GalleryTopBarFiltersContent />
    </GalleryTopBarFiltersProvider>
  );
}
