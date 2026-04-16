import type { CachedCard } from "@/lib/universus/card-store";

export interface CardGridItemProps {
  card: CachedCard;
  backCard?: CachedCard | null;
  onCardClick?: (card: CachedCard) => void | Promise<void>;
  onOpenCardDetails?: (card: CachedCard) => void;
  dragSourceId?: string;
  showDeckActions?: boolean;
  imagePriority?: boolean;
}
