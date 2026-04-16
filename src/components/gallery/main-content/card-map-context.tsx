import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useCardData } from "@/lib/universus/card-data-provider";
import type { CachedCard } from "@/lib/universus/card-store";
import { useCardIdMap } from "@/hooks/useCardIdMap";

interface GalleryCardMapContextValue {
  getBackCard: (card: CachedCard) => CachedCard | null;
}

const GalleryCardMapContext = createContext<GalleryCardMapContextValue | null>(null);

interface GalleryCardMapProviderProps {
  children: ReactNode;
}

export function GalleryCardMapProvider({ children }: GalleryCardMapProviderProps) {
  const { cards } = useCardData();
  const cardIdMap = useCardIdMap(cards);

  const getBackCard = useCallback(
    (card: CachedCard) => {
      if (!card.backCardId) return null;
      return cardIdMap.get(card.backCardId) ?? null;
    },
    [cardIdMap]
  );

  const value = useMemo(() => ({ getBackCard }), [getBackCard]);

  return <GalleryCardMapContext.Provider value={value}>{children}</GalleryCardMapContext.Provider>;
}

export function useGalleryCardMap() {
  const context = useContext(GalleryCardMapContext);

  if (!context) {
    throw new Error("useGalleryCardMap must be used within GalleryCardMapProvider");
  }

  return context;
}
