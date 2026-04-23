"use client";

import { GalleryViewModeFields } from "@/components/gallery/gallery-top-bar-filters/view-mode-popover";

export function GalleryFilterDialogMobileViewSection() {
  return (
    <div className="md:hidden">
      <GalleryViewModeFields layout="panel" />
    </div>
  );
}
