"use client";

import {
  FloatingCapsuleCluster,
  FloatingPageBar,
  FloatingSearchCapsule,
} from "@/components/shell/floating-page-bar";
import { useGalleryTopBarFiltersContext } from "../context";
import { AnchoredFilterPanel } from "./anchored-filter-panel";
import {
  InlineFunnelButton,
  InlineResultCount,
  InlineScopeSelect,
  InlineViewModeButton,
  ToolbarDivider,
} from "./toolbar-bits";

export function GalleryTopBarIslandVariant() {
  const { state, actions } = useGalleryTopBarFiltersContext();

  const placeholder =
    state.searchMode === "name"
      ? "Search by card name…"
      : state.searchMode === "text"
        ? "Search for card text…"
        : "Search all card information…";

  return (
    <FloatingPageBar
      center={
        <div className="relative w-full min-w-0">
          <FloatingSearchCapsule
            value={state.search}
            onChange={actions.setSearch}
            placeholder={placeholder}
            name="gallery-search"
            aria-label="Search cards"
          >
            <InlineScopeSelect shape="island" />
          </FloatingSearchCapsule>
          <div className="pointer-events-none absolute inset-x-0 top-full z-[140] mt-2 flex justify-center">
            <AnchoredFilterPanel />
          </div>
        </div>
      }
      right={
        <FloatingCapsuleCluster>
          <InlineResultCount className="px-1" />
          <ToolbarDivider className="h-4" />
          <InlineFunnelButton />
          <InlineViewModeButton />
        </FloatingCapsuleCluster>
      }
    />
  );
}
