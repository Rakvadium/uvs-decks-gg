"use client";

import { ChevronLeft } from "lucide-react";
import { SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "../filter-dialog/context";
import { useGalleryMobileFilterNav, type GalleryMobileFilterPage } from "./context";
import { sectionHeadingVariants } from "@/components/ui/typography-headings";

const PAGE_TITLES: Record<GalleryMobileFilterPage, string> = {
  root: "Filters",
  format: "Format",
  sets: "Sets",
  type: "Type",
  symbols: "Symbols",
  keywords: "Keywords",
  colors: "Colors",
  tags: "Tags",
  stats: "Stats",
  rarity: "Rarity",
};

const headerButtonClassName =
  "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-pill px-2 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

/** `inline` renders outside a Sheet (the Menu layout's tools panel), so the title is a plain heading. */
export function GalleryMobileFilterHeader({ onClose, inline = false }: { onClose: () => void; inline?: boolean }) {
  const { page, back } = useGalleryMobileFilterNav();
  const { meta, actions, hasActiveFilters } = useGalleryFilterDialogContext();
  const isRoot = page === "root";

  return (
    <div className="grid h-11 shrink-0 grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center border-b border-hairline px-2">
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
        {inline ? (
          <h2 className={cn(sectionHeadingVariants({ size: "sm" }), "truncate text-foreground")}>{PAGE_TITLES[page]}</h2>
        ) : (
          <SheetTitle className={cn(sectionHeadingVariants({ size: "sm" }), "truncate text-foreground")}>
            {PAGE_TITLES[page]}
          </SheetTitle>
        )}
        <span className="text-xs tabular-nums text-muted-foreground">
          {meta.filteredCount.toLocaleString()} of {meta.formatCardCount.toLocaleString()}
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
