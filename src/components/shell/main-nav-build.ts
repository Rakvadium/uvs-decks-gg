import { LayoutGrid, Layers, Library, Users, type LucideIcon } from "lucide-react";

export interface MainNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const BASE_MAIN_NAV_ITEMS: MainNavItem[] = [
  { path: "gallery", label: "Card Gallery", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library },
  { path: "community", label: "Community", icon: Users },
];

export function buildMainNavItems(): MainNavItem[] {
  return [...BASE_MAIN_NAV_ITEMS];
}

export function buildMainNavItemsMobileOrder(): MainNavItem[] {
  const items = [...BASE_MAIN_NAV_ITEMS];
  const collectionIdx = items.findIndex((item) => item.path === "collection");
  const communityIdx = items.findIndex((item) => item.path === "community");
  if (collectionIdx !== -1 && communityIdx !== -1) {
    [items[collectionIdx], items[communityIdx]] = [items[communityIdx]!, items[collectionIdx]!];
  }
  return items;
}
