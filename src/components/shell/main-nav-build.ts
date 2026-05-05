import { LayoutGrid, Layers, Library, Users, UsersRound, type LucideIcon } from "lucide-react";

export interface MainNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const TEAMS_NAV_ITEM: MainNavItem = {
  path: "teams",
  label: "Teams",
  icon: UsersRound,
};

export const BASE_MAIN_NAV_ITEMS: MainNavItem[] = [
  { path: "gallery", label: "Card Gallery", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library },
  { path: "community", label: "Community", icon: Users },
];

export function buildMainNavItems(): MainNavItem[] {
  const items = [...BASE_MAIN_NAV_ITEMS];
  const community = items.pop()!;
  return [...items, TEAMS_NAV_ITEM, community];
}
