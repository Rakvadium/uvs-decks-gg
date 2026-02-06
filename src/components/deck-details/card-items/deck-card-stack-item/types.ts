import type { CachedCard } from "@/lib/universus";

export type DeckCardStackItemProps = {
  card: CachedCard;
  quantity: number;
  backCard?: CachedCard | null;
};
