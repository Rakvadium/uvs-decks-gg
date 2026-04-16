import type { CachedCard } from "@/lib/universus/card-store";

export type DeckCardStackItemProps = {
  card: CachedCard;
  quantity: number;
  backCard?: CachedCard | null;
};
