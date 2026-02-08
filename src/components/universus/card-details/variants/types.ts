import type { CachedCard } from "@/lib/universus";

export interface CardDetailsVariantProps {
  card: CachedCard;
  displayCard: CachedCard;
  backCard: CachedCard | null;
  hasBack: boolean;
  isFlipped: boolean;
  onToggleFlip: () => void;
}
