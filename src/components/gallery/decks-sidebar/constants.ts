import { FolderOpen, Globe, Trophy } from "lucide-react";
import type { DeckTab } from "@/hooks/useDeckCatalogData";

export const TABS: Array<{ id: DeckTab; label: string; shortLabel: string; icon: typeof FolderOpen }> = [
  { id: "my-decks", label: "My Decks", shortLabel: "Mine", icon: FolderOpen },
  { id: "public", label: "Public", shortLabel: "Public", icon: Globe },
  { id: "tournament", label: "Tournament", shortLabel: "Tourny", icon: Trophy },
];
