"use client";

import { GalleryMainContent } from "../gallery-main-content";
import { useGalleryView } from "./hook";

export function GalleryView() {
  useGalleryView();
  return <GalleryMainContent />;
}

export { GalleryView as UniversusGalleryView };
