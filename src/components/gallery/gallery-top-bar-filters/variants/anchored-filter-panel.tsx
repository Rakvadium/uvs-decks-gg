"use client";

import { useEffect, useRef, type RefObject } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import {
  GalleryMobileFilterNavProvider,
  useGalleryMobileFilterNav,
  type GalleryMobileFilterPage,
} from "@/components/gallery/mobile-filter-sheet/context";
import {
  GalleryDesktopFilterFormatPage,
  GalleryDesktopFilterRootPage,
  GalleryDesktopFilterSymbolsPage,
  GalleryDesktopFilterTypePage,
  GalleryFilterRarityPage,
} from "@/components/gallery/mobile-filter-sheet/root-page";
import {
  GalleryDesktopFilterKeywordsPage,
  GalleryDesktopFilterSetsPage,
  GalleryDesktopFilterStatsPage,
} from "./desktop-filter-pages";
import { floatingIslandRingClassName } from "@/components/shell/floating-island";
import { cn } from "@/lib/utils";
import { useGalleryTopBarFiltersContext } from "../context";

const PAGE_TITLES: Record<GalleryMobileFilterPage, string> = {
  root: "Filters",
  format: "Format",
  sets: "Sets",
  type: "Type",
  symbols: "Symbols",
  keywords: "Keywords",
  stats: "Stats",
  rarity: "Rarity",
};

const headerButtonClassName =
  "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-2 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

function ActivePage() {
  const { page } = useGalleryMobileFilterNav();

  if (page === "format") return <GalleryDesktopFilterFormatPage />;
  if (page === "sets") return <GalleryDesktopFilterSetsPage />;
  if (page === "type") return <GalleryDesktopFilterTypePage />;
  if (page === "symbols") return <GalleryDesktopFilterSymbolsPage />;
  if (page === "keywords") return <GalleryDesktopFilterKeywordsPage />;
  if (page === "stats") return <GalleryDesktopFilterStatsPage />;
  if (page === "rarity") return <GalleryFilterRarityPage />;
  return <GalleryDesktopFilterRootPage />;
}

const panelToggleClassName = "flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground";

function DesktopFilterToggleBar() {
  const { page } = useGalleryMobileFilterNav();
  const { filters, actions, setBooleanFilter, setIncludeInfinityResults } = useGalleryFilterDialogContext();

  if (page === "format") {
    return (
      <div className="flex shrink-0 items-center justify-end px-4 pt-3">
        <Label className={panelToggleClassName}>
          <Switch
            checked={filters.includeBanned === true}
            onCheckedChange={(checked) => actions.updateFilter("includeBanned", checked ? true : undefined)}
            aria-label="Include banned cards"
          />
          Include banned
        </Label>
      </div>
    );
  }

  if (page === "symbols") {
    return (
      <div className="flex shrink-0 items-center justify-end gap-3 px-4 pt-3">
        <Label className={panelToggleClassName}>
          <Switch
            checked={filters.includeInfinity !== false}
            onCheckedChange={setIncludeInfinityResults}
            aria-label="Include Infinity"
          />
          Infinity
        </Label>
        <Label className={panelToggleClassName}>
          <Switch
            checked={filters.symbolMatchAll ?? false}
            onCheckedChange={(checked) => setBooleanFilter("symbolMatchAll", checked)}
            aria-label="Match all symbols"
          />
          All
        </Label>
      </div>
    );
  }

  if (page === "keywords") {
    return (
      <div className="flex shrink-0 items-center justify-end px-4 pt-3">
        <Label className={panelToggleClassName}>
          <Switch
            checked={filters.keywordMatchAll ?? false}
            onCheckedChange={(checked) => setBooleanFilter("keywordMatchAll", checked)}
            aria-label="Match all keywords"
          />
          Match all
        </Label>
      </div>
    );
  }

  return null;
}

function DesktopFilterHeader({ onClose }: { onClose: () => void }) {
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
          <button
            type="button"
            className={cn(headerButtonClassName, "gap-0.5 pl-1")}
            onClick={back}
            aria-label="Back to filters"
          >
            <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
            Filters
          </button>
        )}
      </div>
      <div className="flex min-w-0 flex-col items-center justify-center leading-tight">
        <h2 className="chrome-heading-case truncate text-[15px] font-semibold text-foreground">
          {PAGE_TITLES[page]}
        </h2>
        <span className="text-[11px] tabular-nums text-muted-foreground">
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

function DesktopFilterFooter({ onClose }: { onClose: () => void }) {
  const { meta } = useGalleryFilterDialogContext();
  const count = meta.filteredCount;

  return (
    <div className="shrink-0 border-t border-border/30 px-4 py-3">
      <Button type="button" className="h-11 w-full text-[15px]" onClick={onClose}>
        Show {count.toLocaleString()} {count === 1 ? "card" : "cards"}
      </Button>
    </div>
  );
}

function AnchoredFilterPanelBody({
  className,
  panelRef,
  onClose,
}: {
  className?: string;
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const { page, direction } = useGalleryMobileFilterNav();
  const scrollsInside = page === "sets";

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Filter cards"
      aria-modal="false"
      className={cn(
        "pointer-events-auto relative w-max min-w-[32rem] max-w-[min(48rem,100%)] rounded-xl p-px shadow-[var(--chrome-floating-shadow)]",
        floatingIslandRingClassName,
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200",
        className
      )}
    >
      <div
        className={cn(
          "flex max-h-[42rem] flex-col overflow-hidden rounded-xl bg-background/80 backdrop-blur-xl",
          scrollsInside ? "h-[72vh]" : "h-auto"
        )}
      >
      <DesktopFilterHeader onClose={onClose} />
      <DesktopFilterToggleBar />
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
      <DesktopFilterFooter onClose={onClose} />
      </div>
    </div>
  );
}

export function AnchoredFilterPanel({ className }: { className?: string }) {
  const { isFilterPanelOpen, filterPanelPage, setFilterPanelPage, setFilterPanelOpen } =
    useGalleryTopBarFiltersContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setFilterPanelOpen(false);

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
    <GalleryMobileFilterNavProvider
      initialPage={filterPanelPage}
      onNavigate={setFilterPanelPage}
    >
      <AnchoredFilterPanelBody className={className} panelRef={panelRef} onClose={close} />
    </GalleryMobileFilterNavProvider>
  );
}
