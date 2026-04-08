import type { CachedCard } from "@/lib/universus";

export interface CardGridItemProps {
  card: CachedCard;
  backCard?: CachedCard | null;
  onCardClick?: (card: CachedCard) => void | Promise<void>;
  dragSourceId?: string;
  showDeckActions?: boolean;
}
