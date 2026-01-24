"use client";

import { GalleryView } from "@/components/gallery";

export default function GalleryPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <GalleryView />
    </div>
  );
}
