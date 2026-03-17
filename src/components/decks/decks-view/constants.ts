import { FolderOpen, Globe, Trophy } from "lucide-react";
import type { DeckTab } from "@/hooks/useDeckCatalogData";

export const TABS: Array<{ id: DeckTab; label: string; shortLabel: string; icon: typeof FolderOpen }> = [
  { id: "my-decks", label: "My Decks", shortLabel: "My Decks", icon: FolderOpen },
  { id: "public", label: "Public Decks", shortLabel: "Public", icon: Globe },
  { id: "tournament", label: "Tournament Decks", shortLabel: "Tournament", icon: Trophy },
];
