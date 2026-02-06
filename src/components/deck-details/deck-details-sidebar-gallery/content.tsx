"use client";

import { GalleryFilterDialog } from "@/components/gallery/gallery-header";
import {
  GallerySidebarProvider,
  useAvailableGallerySidebarContext,
  useGallerySidebarContext,
} from "./context";
import { DeckDetailsGallerySidebarBody } from "./body";
import { DeckDetailsGallerySidebarHeader } from "./header";
import { DeckDetailsGallerySidebarHoverPreview } from "./hover-preview";

function GallerySidebarUnavailable() {
  return (
    <div className="p-4">
      <p className="text-xs text-muted-foreground">Gallery filters are unavailable on this route.</p>
    </div>
  );
}

function DeckDetailsGallerySidebarContent() {
  const { gallery } = useGallerySidebarContext();

  if (!gallery) {
    return <GallerySidebarUnavailable />;
  }

  return <DeckDetailsGallerySidebarAvailableContent />;
}

function DeckDetailsGallerySidebarAvailableContent() {
  const { isFilterDialogOpen, setIsFilterDialogOpen } = useAvailableGallerySidebarContext();

  return (
    <>
      <DeckDetailsGallerySidebarHoverPreview />
      <div className="flex h-full flex-col">
        <DeckDetailsGallerySidebarHeader />
        <DeckDetailsGallerySidebarBody />
        <GalleryFilterDialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen} />
      </div>
    </>
  );
}

export function GallerySidebar() {
  return (
    <GallerySidebarProvider>
      <DeckDetailsGallerySidebarContent />
    </GallerySidebarProvider>
  );
}
