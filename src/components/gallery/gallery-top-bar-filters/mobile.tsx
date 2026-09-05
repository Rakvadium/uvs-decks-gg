"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { MobileActButton } from "@/components/shell/mobile-tab-bar/act-button";
import { MOBILE_TAB_ICON_CLASS } from "@/components/shell/mobile-tab-bar/metrics";
import { MobileSearchField } from "@/components/shell/mobile-tab-bar/search-field";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { GalleryMobileFilterSheet } from "../mobile-filter-sheet";
import { GalleryTopBarFiltersProvider, useGalleryTopBarFiltersContext } from "./context";

function searchPlaceholder(mode: "name" | "text" | "all") {
  if (mode === "name") return "Search by name…";
  if (mode === "text") return "Search card text…";
  return "Search all cards…";
}

function GalleryMobileSearchContent({ autoFocus }: { autoFocus?: boolean }) {
  const { state, actions } = useGalleryTopBarFiltersContext();

  useEffect(() => {
    if (state.viewMode === "details") {
      actions.setViewMode("list");
    }
  }, [actions, state.viewMode]);

  return (
    <MobileSearchField
      value={state.search}
      onChange={actions.setSearch}
      placeholder={searchPlaceholder(state.searchMode)}
      label="Search cards"
      name="gallery-search"
      autoFocus={autoFocus}
    />
  );
}

export function GalleryMobileSearch({ autoFocus }: { autoFocus?: boolean }) {
  return (
    <GalleryTopBarFiltersProvider>
      <GalleryMobileSearchContent autoFocus={autoFocus} />
    </GalleryTopBarFiltersProvider>
  );
}

export function useGalleryMobileSearchState() {
  const filtersContext = useGalleryFiltersOptional();
  return {
    available: Boolean(filtersContext),
    active: Boolean(filtersContext && filtersContext.state.search.trim().length > 0),
  };
}

export function GalleryMobileActions() {
  const filtersContext = useGalleryFiltersOptional();
  const [isOpen, setOpen] = useState(false);
  if (!filtersContext) return null;

  const count = filtersContext.meta.activeFilterCount;

  return (
    <>
      <MobileActButton
        label="Filters"
        active={count > 0}
        badge={count}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className={MOBILE_TAB_ICON_CLASS} strokeWidth={count > 0 ? 2.5 : 2.25} />
      </MobileActButton>
      <GalleryMobileFilterSheet open={isOpen} onOpenChange={setOpen} />
    </>
  );
}

export function useGalleryMobileActionsState() {
  return Boolean(useGalleryFiltersOptional());
}
