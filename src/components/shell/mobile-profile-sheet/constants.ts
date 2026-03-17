import { LayoutGrid, Layers, Library, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "gallery", label: "Card Gallery", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library },
  { path: "community", label: "Community", icon: Users },
];
