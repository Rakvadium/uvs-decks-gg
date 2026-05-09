import type { CachedCard } from "@/lib/universus/card-store";

export type SidebarGalleryListItemProps = {
  card: CachedCard;
  backCard?: CachedCard | null;
  onHoverCard: (card: CachedCard, rect?: DOMRect) => void;
  onClearHover: () => void;
};
