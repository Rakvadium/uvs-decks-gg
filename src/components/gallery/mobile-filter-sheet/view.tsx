"use client";

import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MOBILE_SHEET_GRABBER, MOBILE_SHEET_PANEL } from "@/components/shell/mobile-glass";
import { useGrabberDismiss } from "@/components/shell/mobile-profile-sheet/use-grabber-dismiss";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { cn } from "@/lib/utils";
import { GalleryFilterDialogProvider } from "../filter-dialog/context";
import { GalleryTopBarFiltersProvider } from "../gallery-top-bar-filters/context";
import { GalleryMobileFilterNavProvider, useGalleryMobileFilterNav } from "./context";
import { GalleryMobileFilterFooter } from "./footer";
import { GalleryMobileFilterHeader } from "./header";
import { GalleryMobileFilterKeywordsPage, GalleryMobileFilterSetsPage } from "./picker-page";
import { GalleryMobileFilterRootPage } from "./root-page";
import { GalleryMobileFilterStatsPage } from "./stats-page";

interface GalleryMobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ActivePage() {
  const { page } = useGalleryMobileFilterNav();

  if (page === "sets") return <GalleryMobileFilterSetsPage />;
  if (page === "keywords") return <GalleryMobileFilterKeywordsPage />;
  if (page === "stats") return <GalleryMobileFilterStatsPage />;
  return <GalleryMobileFilterRootPage />;
}

function GalleryMobileFilterSheetBody({ open, onOpenChange }: GalleryMobileFilterSheetProps) {
  const { page, direction, reset } = useGalleryMobileFilterNav();
  const close = () => onOpenChange(false);
  const { panelRef, resetTranslate, grabberProps } = useGrabberDismiss(close);
  const scrollsInside = page === "sets" || page === "keywords";

  useEffect(() => {
    if (!open) {
      const timeout = window.setTimeout(reset, 250);
      return () => window.clearTimeout(timeout);
    }
  }, [open, reset]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) resetTranslate();
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "flex h-[88dvh] flex-col gap-0 border-0 bg-transparent p-0 shadow-none",
          "data-[state=open]:duration-300 data-[state=closed]:duration-200"
        )}
      >
        <div ref={panelRef} className={cn("flex min-h-0 flex-1 flex-col gap-0", MOBILE_SHEET_PANEL)}>
          <div className="flex min-h-8 touch-none select-none justify-center pb-2 pt-3" {...grabberProps}>
            <span aria-hidden className={MOBILE_SHEET_GRABBER} />
          </div>
          <GalleryMobileFilterHeader onClose={close} />
          <div
            key={page}
            className={cn(
              "min-h-0 flex-1 overscroll-contain",
              scrollsInside ? "overflow-hidden" : "overflow-y-auto",
              "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200",
              direction === "forward" ? "motion-safe:slide-in-from-right-4" : "motion-safe:slide-in-from-left-4"
            )}
          >
            <ActivePage />
          </div>
          <GalleryMobileFilterFooter onClose={close} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function GalleryMobileFilterSheet(props: GalleryMobileFilterSheetProps) {
  const filtersContext = useGalleryFiltersOptional();
  if (!filtersContext) return null;

  return (
    <GalleryFilterDialogProvider filtersContext={filtersContext}>
      <GalleryTopBarFiltersProvider>
        <GalleryMobileFilterNavProvider>
          <GalleryMobileFilterSheetBody {...props} />
        </GalleryMobileFilterNavProvider>
      </GalleryTopBarFiltersProvider>
    </GalleryFilterDialogProvider>
  );
}
