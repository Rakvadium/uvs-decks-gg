"use client";

import { FloatingPageBar, FloatingSearchCapsule } from "@/components/shell/floating-page-bar";
import { useGalleryTopBarFiltersContext } from "../context";
import { AnchoredFilterPanel } from "./anchored-filter-panel";
import { FilterTokens } from "./filter-tokens";
import {
  InlineFunnelButton,
  InlineResultCount,
  InlineScopeSelect,
  InlineViewModeButton,
  ToolbarDivider,
} from "./toolbar-bits";

export function GalleryTopBarFilters() {
  const { state, actions } = useGalleryTopBarFiltersContext();

  const placeholder =
    state.searchMode === "name"
      ? "Search by card name…"
      : state.searchMode === "text"
        ? "Search for card text…"
        : "Search all card information…";

  return (
    <FloatingPageBar
      centerWidth="wide"
      center={
        <div className="relative flex w-full min-w-0 flex-col items-center gap-2">
          <FloatingSearchCapsule
            value={state.search}
            onChange={actions.setSearch}
            placeholder={placeholder}
            name="gallery-search"
            aria-label="Search cards"
          >
            <InlineScopeSelect shape="island" />
            <ToolbarDivider className="h-4" />
            <InlineResultCount className="px-1" />
            <ToolbarDivider className="h-4" />
            <InlineFunnelButton />
            <InlineViewModeButton />
          </FloatingSearchCapsule>
          <div className="pointer-events-auto relative z-[150] w-full">
            <FilterTokens centered />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-full z-[140] mt-2 flex justify-center">
            <AnchoredFilterPanel />
          </div>
        </div>
      }
    />
  );
}
