import { Home, LayoutGrid, Layers, Library, Users } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "home", label: "Home", icon: Home },
  { path: "gallery", label: "Card Gallery", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library },
  { path: "community", label: "Community", icon: Users },
];
