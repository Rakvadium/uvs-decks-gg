import { Layers, BookOpen, Bookmark } from "lucide-react";

export type DeckSection = "main" | "side" | "reference";

export const CARD_TYPE_ORDER = ["Attack", "Foundation", "Action", "Asset", "Backup", "Character"] as const;

export const CARD_TYPE_LABELS: Record<string, string> = {
  Attack: "Attacks",
  Foundation: "Foundations",
  Action: "Actions",
  Asset: "Assets",
  Backup: "Backups",
  Character: "Characters",
};

export const DECK_SECTION_META = {
  main: { label: "Main", icon: Layers },
  side: { label: "Side", icon: BookOpen },
  reference: { label: "Reference", icon: Bookmark },
} as const;

export const DECK_SECTION_CONFIG = {
  main: { label: "Main Deck", icon: Layers, color: "primary" },
  side: { label: "Sideboard", icon: BookOpen, color: "secondary" },
  reference: { label: "Reference", icon: Bookmark, color: "accent" },
} as const;

export const DECK_SECTION_KEYS: DeckSection[] = ["main", "side", "reference"];
