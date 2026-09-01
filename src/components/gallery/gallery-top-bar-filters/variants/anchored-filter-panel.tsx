"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import { FormatTypeRaritySection } from "@/components/gallery/filter-dialog/format-type-rarity-section";
import { KeywordsSection } from "@/components/gallery/filter-dialog/keywords-section";
import { SetSection } from "@/components/gallery/filter-dialog/set-section";
import { StatsSection } from "@/components/gallery/filter-dialog/stats-section";
import { SymbolsSection } from "@/components/gallery/filter-dialog/symbols-section";
import { cn } from "@/lib/utils";
import { useGalleryTopBarFiltersContext } from "../context";

export function AnchoredFilterPanel({ className }: { className?: string }) {
  const { isFilterPanelOpen, setFilterPanelOpen } = useGalleryTopBarFiltersContext();
  const { meta, actions, hasActiveFilters } = useGalleryFilterDialogContext();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFilterPanelOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterPanelOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (target.closest("[data-radix-popper-content-wrapper]")) return;
      if (target.closest("[data-gallery-filter-panel-trigger]")) return;
      setFilterPanelOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isFilterPanelOpen, setFilterPanelOpen]);

  if (!isFilterPanelOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Filter cards"
      className={cn(
        "absolute inset-x-0 top-full z-[140] mt-2 flex max-h-[min(66vh,42rem)] flex-col overflow-hidden rounded-lg",
        "border border-[color:var(--control-dual-border)] bg-popover/95 backdrop-blur-xl",
        "shadow-[var(--chrome-popover-shadow),var(--popover-dual-glow)]",
        "animate-in fade-in-0 slide-in-from-top-2 duration-200",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/30 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <SlidersHorizontal className="size-4 shrink-0 text-primary" />
          <span className="chrome-label-case text-xs text-foreground">
            Filters
          </span>
          <span className="truncate text-[11px] tabular-nums text-muted-foreground">
            {meta.filteredCount.toLocaleString()} / {meta.totalCards.toLocaleString()} cards
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="destructiveOutline"
              size="sm"
              className="h-7 gap-1.5 px-2.5"
              onClick={actions.clearAllFilters}
            >
              <X className="size-3.5" />
              <span className="chrome-label-case text-[10px]">Clear all</span>
            </Button>
          ) : null}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--control-dual-ring)]"
            aria-label="Close filter panel"
            onClick={() => setFilterPanelOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="@container relative z-10 min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <FormatTypeRaritySection />
          <div className="grid grid-cols-1 items-start gap-4 @2xl:grid-cols-2">
            <SymbolsSection />
            <KeywordsSection />
          </div>
          <StatsSection columns />
          <SetSection />
        </div>
      </div>
    </div>
  );
}
