"use client";

import { GalleryFilterDialog } from "@/components/gallery/gallery-header";
import {
  GallerySidebarProvider,
  useAvailableGallerySidebarContext,
  useGallerySidebarContext,
} from "./context";
import { DeckDetailsGallerySidebarBottomBar } from "./bottom-bar";
import { DeckDetailsGallerySidebarBody } from "./body";
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
  const { isFilterDialogOpen, setIsFilterDialogOpen, isMobile } = useAvailableGallerySidebarContext();

  return (
    <>
      <DeckDetailsGallerySidebarHoverPreview />
      <div className="flex h-full min-h-0 flex-col">
        {isMobile ? (
          <>
            <DeckDetailsGallerySidebarBody />
            <DeckDetailsGallerySidebarBottomBar position="bottom" />
          </>
        ) : (
          <>
            <DeckDetailsGallerySidebarBottomBar position="top" />
            <DeckDetailsGallerySidebarBody />
          </>
        )}
      </div>
      <GalleryFilterDialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen} />
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
