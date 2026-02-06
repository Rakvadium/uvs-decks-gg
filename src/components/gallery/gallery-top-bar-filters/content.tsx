"use client";

import { GalleryTopBarFiltersProvider } from "./context";
import { GalleryFilterControls } from "./filter-controls";
import { GallerySearchControls } from "./search-controls";

function GalleryTopBarFiltersContent() {
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
