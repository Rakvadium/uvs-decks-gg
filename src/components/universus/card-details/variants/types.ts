import type { CachedCard } from "@/lib/universus";
import type { ReactNode } from "react";

export interface CardDetailsVariantProps {
  card: CachedCard;
  displayCard: CachedCard;
  backCard: CachedCard | null;
  hasBack: boolean;
  isFlipped: boolean;
  onToggleFlip: () => void;
  mobileNavigationPrevious?: ReactNode;
  mobileNavigationNext?: ReactNode;
}
