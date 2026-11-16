"use client";

import { usePathname } from "next/navigation";
import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import {
  CommunityTierListsPageMobileSearch,
  useCommunityTierListsPageMobileSearchState,
} from "@/components/community/tier-lists/page-view/top-bar";
import { DecksMobileToolsPanel, useDecksMobileToolsState } from "@/components/decks/decks-view/mobile-bottom-tools";
import { GalleryMobileFilterPanel } from "@/components/gallery/mobile-filter-sheet";
import { GalleryMobileSearch, useGalleryMobileSearchState } from "@/components/gallery/gallery-top-bar-filters/mobile";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { MOBILE_TAB_ICON_CLASS } from "../mobile-tab-bar/metrics";
import { useMobileChromeTargetRef } from "./chrome-portal";
import { resolveMobileLayoutRoute } from "./routes";
import { MobileToolsPanelHeader, MobileToolsPill } from "./tools-pill";

const searchIcon = (active: boolean) => <Search className={MOBILE_TAB_ICON_CLASS} strokeWidth={active ? 2.5 : 2.25} />;

function GalleryTools() {
  const search = useGalleryMobileSearchState();
  const filters = useGalleryFiltersOptional();
  if (!filters) return null;
  const count = filters.meta.activeFilterCount;

  return (
    <MobileToolsPill
      label="Search and filter cards"
      triggers={[
        { id: "search", label: "Search cards", icon: searchIcon(search.active), active: search.active },
        {
          id: "filter",
          label: "Filters",
          icon: <SlidersHorizontal className={MOBILE_TAB_ICON_CLASS} strokeWidth={count > 0 ? 2.5 : 2.25} />,
          active: count > 0,
          badge: count,
        },
      ]}
    >
      {({ focus, close }) => (
        <>
          <div className="shrink-0 px-3 pb-1 pt-3">
            <GalleryMobileSearch autoFocus={focus === "search"} />
          </div>
          <GalleryMobileFilterPanel onClose={close} />
        </>
      )}
    </MobileToolsPill>
  );
}

function DecksTools() {
  const state = useDecksMobileToolsState();
  if (!state) return null;

  return (
    <MobileToolsPill
      label="Search, show and sort decks"
      triggers={[
        { id: "search", label: "Search decks", icon: searchIcon(state.searchActive), active: state.searchActive },
        {
          id: "sort",
          label: "Show, sort and filter decks",
          icon: <ArrowUpDown className={MOBILE_TAB_ICON_CLASS} strokeWidth={state.viewCount > 0 ? 2.5 : 2.25} />,
          active: state.viewCount > 0,
          badge: state.viewCount,
        },
      ]}
    >
      {({ focus, close }) => <DecksMobileToolsPanel focus={focus} onClose={close} />}
    </MobileToolsPill>
  );
}

function TierListTools() {
  const search = useCommunityTierListsPageMobileSearchState();
  if (!search.available) return null;

  return (
    <MobileToolsPill
      label="Search tier lists"
      triggers={[{ id: "search", label: "Search tier lists", icon: searchIcon(search.active), active: search.active }]}
    >
      {({ close }) => (
        <>
          <MobileToolsPanelHeader title="Search" onDone={close} />
          <div className="p-3">
            <CommunityTierListsPageMobileSearch autoFocus />
          </div>
        </>
      )}
    </MobileToolsPill>
  );
}

/**
 * Host for the top-right tools pill. Covers the page (without taking pointer events) so the pill
 * can grow into a full panel. Deck details renders its own pill into the portal target.
 */
export function MobileHeaderTools() {
  const pathname = usePathname().split("?")[0] ?? "";
  const route = resolveMobileLayoutRoute(pathname);
  const portalRef = useMobileChromeTargetRef("header-tools");

  if (route.headerTools === "none") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-modal">
      {route.headerTools === "gallery" ? <GalleryTools /> : null}
      {route.headerTools === "decks" ? <DecksTools /> : null}
      {route.headerTools === "tier-lists" ? <TierListTools /> : null}
      {route.headerTools === "portal" ? <div ref={portalRef} className="absolute inset-0" /> : null}
    </div>
  );
}
