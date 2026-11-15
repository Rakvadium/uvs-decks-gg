"use client";

import type { ReactNode } from "react";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { GalleryFilterDialogProvider } from "@/components/gallery/filter-dialog/context";
import { GalleryTopBarFiltersProvider } from "./context";

function GalleryFilterDialogBridge({ children }: { children: ReactNode }) {
  const filtersContext = useGalleryFiltersOptional();

  if (!filtersContext) {
    return null;
  }

  return <GalleryFilterDialogProvider filtersContext={filtersContext}>{children}</GalleryFilterDialogProvider>;
}

export function GalleryToolbarProvider({ children }: { children: ReactNode }) {
  return (
    <GalleryTopBarFiltersProvider>
      <GalleryFilterDialogBridge>{children}</GalleryFilterDialogBridge>
    </GalleryTopBarFiltersProvider>
  );
}
