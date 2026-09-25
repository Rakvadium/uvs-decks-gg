import { Layers, BookOpen, Bookmark } from "lucide-react";

export type DeckSection = "main" | "side" | "reference";

// UVS card-type order/labels live in the shared UVS game module.
export { CARD_TYPE_LABELS, CARD_TYPE_ORDER } from "@shared/games/uvs/card-types";

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

export const DECK_SECTION_MOBILE_TAB_LABELS = {
  main: "Main",
  side: "Side",
  reference: "Ref",
} satisfies Record<DeckSection, string>;

export const DECK_SECTION_KEYS: DeckSection[] = ["main", "side", "reference"];
