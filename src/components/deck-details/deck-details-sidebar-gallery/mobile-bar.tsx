"use client";

import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { searchPlaceholder } from "@/components/gallery/gallery-top-bar-filters/mobile";
import { GalleryMobileFilterSheet } from "@/components/gallery/mobile-filter-sheet";
import { MOBILE_GLASS_HAIRLINE_TOP } from "@/components/shell/mobile-glass";
import { MobileActButton } from "@/components/shell/mobile-tab-bar/act-button";
import { MOBILE_TAB_ICON_CLASS, MOBILE_TAB_METRIC_VARS } from "@/components/shell/mobile-tab-bar/metrics";
import { MobileSearchField } from "@/components/shell/mobile-tab-bar/search-field";
import { cn } from "@/lib/utils";
import { useAvailableGallerySidebarContext } from "./context";

export function DeckDetailsGallerySidebarMobileBar() {
  const { gallery, viewMode, setViewMode, isFilterDialogOpen, setIsFilterDialogOpen } =
    useAvailableGallerySidebarContext();
  const { state, actions, meta } = gallery;
  const count = meta.activeFilterCount;
  const display = useMemo(() => ({ viewMode, setViewMode }), [viewMode, setViewMode]);

  return (
    <>
      <div
        role="search"
        className={cn("flex shrink-0 items-center gap-2 px-3 py-2", MOBILE_GLASS_HAIRLINE_TOP)}
        style={MOBILE_TAB_METRIC_VARS}
      >
        <MobileSearchField
          value={state.search}
          onChange={actions.setSearch}
          placeholder={searchPlaceholder(state.searchMode)}
          label="Search cards"
          name="deck-sidebar-gallery-search"
        />
        <MobileActButton
          label="Filters"
          active={count > 0}
          badge={count}
          aria-haspopup="dialog"
          aria-expanded={isFilterDialogOpen}
          onClick={() => setIsFilterDialogOpen(true)}
        >
          <SlidersHorizontal className={MOBILE_TAB_ICON_CLASS} strokeWidth={count > 0 ? 2.5 : 2.25} />
        </MobileActButton>
      </div>
      <GalleryMobileFilterSheet
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        display={display}
      />
    </>
  );
}
