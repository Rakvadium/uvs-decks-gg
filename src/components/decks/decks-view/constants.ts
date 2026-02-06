import { FolderOpen, Globe, Trophy } from "lucide-react";
import type { DeckTab } from "@/hooks/useDeckCatalogData";

export const TABS: Array<{ id: DeckTab; label: string; icon: typeof FolderOpen }> = [
  { id: "my-decks", label: "My Decks", icon: FolderOpen },
  { id: "public", label: "Public", icon: Globe },
  { id: "tournament", label: "Tournament", icon: Trophy },
];
