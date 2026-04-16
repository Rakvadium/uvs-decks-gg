import type { CachedCard } from "@/lib/universus/card-store";

export interface CardListItemProps {
  card: CachedCard;
  onOpenCardDetails?: (card: CachedCard) => void;
  thumbnailPriority?: boolean;
}
