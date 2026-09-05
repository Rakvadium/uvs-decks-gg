"use client";

import type { ComponentType } from "react";
import {
  CommunityTierListsPageMobileSearch,
  useCommunityTierListsPageMobileSearchState,
} from "@/components/community/tier-lists/page-view/top-bar";
import {
  DeckDetailsMobileActions,
  useDeckDetailsMobileActionsState,
} from "@/components/deck-details/mobile-actions";
import {
  DecksMobileActions,
  DecksMobileSearch,
  useDecksMobileActionsState,
  useDecksMobileSearchState,
} from "@/components/decks/decks-view/mobile-bottom-tools";
import {
  GalleryMobileActions,
  GalleryMobileSearch,
  useGalleryMobileActionsState,
  useGalleryMobileSearchState,
} from "@/components/gallery/gallery-top-bar-filters/mobile";

export interface MobileSearchState {
  available: boolean;
  active: boolean;
}

export interface MobileBottomTools {
  id: string;
  Search?: ComponentType<{ autoFocus?: boolean }>;
  useSearchState?: () => MobileSearchState;
  Actions?: ComponentType;
  useActionsState?: () => boolean;
}

const NONE: MobileBottomTools = { id: "none" };

const GALLERY: MobileBottomTools = {
  id: "gallery",
  Search: GalleryMobileSearch,
  useSearchState: useGalleryMobileSearchState,
  Actions: GalleryMobileActions,
  useActionsState: useGalleryMobileActionsState,
};

const DECKS: MobileBottomTools = {
  id: "decks",
  Search: DecksMobileSearch,
  useSearchState: useDecksMobileSearchState,
  Actions: DecksMobileActions,
  useActionsState: useDecksMobileActionsState,
};

const DECK_DETAILS: MobileBottomTools = {
  id: "deck-details",
  Actions: DeckDetailsMobileActions,
  useActionsState: useDeckDetailsMobileActionsState,
};

const TIER_LISTS: MobileBottomTools = {
  id: "tier-lists",
  Search: CommunityTierListsPageMobileSearch,
  useSearchState: useCommunityTierListsPageMobileSearchState,
};

export function resolveMobileBottomTools(pathname: string): MobileBottomTools {
  if (/^\/gallery(\/|$)/.test(pathname)) return GALLERY;
  if (/^\/decks\/?$/.test(pathname)) return DECKS;
  if (/^\/decks\/[^/]+/.test(pathname)) return DECK_DETAILS;
  if (/^\/community\/tier-lists\/?$/.test(pathname)) return TIER_LISTS;
  return NONE;
}
