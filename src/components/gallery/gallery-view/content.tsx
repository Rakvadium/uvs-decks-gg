"use client";

import { GalleryMainContent } from "../gallery-main-content";
import { GalleryRightSidebarSlots } from "./sidebar-slots";

export function GalleryView() {
  return (
    <>
      <GalleryRightSidebarSlots />
      <GalleryMainContent />
    </>
  );
}

export { GalleryView as UniversusGalleryView };
