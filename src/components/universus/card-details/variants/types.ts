import type { CachedCard } from "@/lib/universus/card-store";
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
  onAdminCardSaved?: (card: CachedCard) => void;
  onSelectPrinting?: (card: CachedCard) => void;
  onVariantCreated?: (card: CachedCard) => void;
}
