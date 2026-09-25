import { LayoutGrid, Layers, Library, Users, type LucideIcon } from "lucide-react";
import { isGameFeatureEnabled, type GameFeatureKey, type GameFeatures } from "@shared/games/features";

export interface MainNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Only shown when this game feature is on. */
  feature?: GameFeatureKey;
}

export const BASE_MAIN_NAV_ITEMS: MainNavItem[] = [
  { path: "gallery", label: "Card Gallery", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library, feature: "collection" },
  { path: "community", label: "Community", icon: Users },
];

/** Main nav items for a game (`features` omitted = every item). */
export function buildMainNavItems(features?: GameFeatures): MainNavItem[] {
  return BASE_MAIN_NAV_ITEMS.filter(
    (item) => !features || !item.feature || isGameFeatureEnabled(features, item.feature),
  );
}

export function buildMainNavItemsMobileOrder(features?: GameFeatures): MainNavItem[] {
  return buildMainNavItems(features);
}
