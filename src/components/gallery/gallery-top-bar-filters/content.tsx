"use client";

import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { GalleryFilterDialogProvider } from "@/components/gallery/filter-dialog/context";
import { GalleryTopBarFiltersProvider } from "./context";
import { GalleryTopBarIslandVariant } from "./variants/variant-island";

function GalleryTopBarFiltersContent() {
  const filtersContext = useGalleryFiltersOptional();

  if (!filtersContext) {
    return null;
  }

  return (
    <GalleryFilterDialogProvider filtersContext={filtersContext}>
      <GalleryTopBarIslandVariant />
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
