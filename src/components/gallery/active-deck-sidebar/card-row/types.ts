import type { DeckSection } from "@/lib/deck/display-config";
import type { CachedCard } from "@/lib/universus";

export interface ActiveDeckCardRowProps {
  card: CachedCard;
  count: number;
  sectionKey: DeckSection;
}
