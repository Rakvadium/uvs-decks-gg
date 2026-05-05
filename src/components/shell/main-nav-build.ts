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
