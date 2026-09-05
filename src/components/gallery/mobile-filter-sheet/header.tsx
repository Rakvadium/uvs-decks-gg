"use client";

import { ChevronLeft } from "lucide-react";
import { SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "../filter-dialog/context";
import { useGalleryMobileFilterNav, type GalleryMobileFilterPage } from "./context";

const PAGE_TITLES: Record<GalleryMobileFilterPage, string> = {
  root: "Filters",
  sets: "Sets",
  keywords: "Keywords",
  stats: "Stats",
};

const headerButtonClassName =
  "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-2 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

export function GalleryMobileFilterHeader({ onClose }: { onClose: () => void }) {
  const { page, back } = useGalleryMobileFilterNav();
  const { meta, actions, hasActiveFilters } = useGalleryFilterDialogContext();
  const isRoot = page === "root";

  return (
    <div className="grid h-11 shrink-0 grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center border-b border-border/30 px-2">
      <div className="flex items-center justify-start">
        {isRoot ? (
          <button
            type="button"
            className={headerButtonClassName}
            onClick={actions.clearAllFilters}
            disabled={!hasActiveFilters}
          >
            Reset
          </button>
        ) : (
          <button type="button" className={cn(headerButtonClassName, "gap-0.5 pl-1")} onClick={back} aria-label="Back to filters">
            <ChevronLeft className="size-5" strokeWidth={2.25} />
            Filters
          </button>
        )}
      </div>
      <div className="flex min-w-0 flex-col items-center justify-center leading-tight">
        <SheetTitle className="chrome-heading-case truncate text-[15px] font-semibold text-foreground">
          {PAGE_TITLES[page]}
        </SheetTitle>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {meta.filteredCount.toLocaleString()} of {meta.totalCards.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center justify-end">
        <button type="button" className={headerButtonClassName} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
