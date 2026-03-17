import { useMemo, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { CardGridItem } from "@/components/universus";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { useInfiniteSlice } from "@/hooks/useInfiniteSlice";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import type { CachedCard } from "@/lib/universus";
import { CARDS_PER_PAGE } from "./constants";
import { LoadMoreIndicator } from "./load-more-indicator";
import { NoCardsFound } from "./no-cards-found";
import { useGalleryCardMap } from "./card-map-context";

interface GalleryGridViewProps {
  cards: CachedCard[];
  cardsPerRow: number;
}

export function GalleryGridView({ cards, cardsPerRow }: GalleryGridViewProps) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { getBackCard } = useGalleryCardMap();
  const clampedCardsPerRow = Math.min(10, Math.max(1, Math.round(cardsPerRow)));
  const mobileGridColsClassName = clampedCardsPerRow <= 1 ? "grid-cols-1" : "grid-cols-2";
  const gridStyle = useMemo(
    () => ({ "--cards-per-row": clampedCardsPerRow }) as CSSProperties,
    [clampedCardsPerRow]
  );
  const { visibleItems: visibleCards, hasMore, loadMoreRef } = useInfiniteSlice({
    items: cards,
    pageSize: CARDS_PER_PAGE,
    rootMargin: isMobile ? "0px 0px 480px 0px" : undefined,
  });

  return (
    <CardNavigationProvider cards={cards} getBackCard={getBackCard}>
      <div
        className={`grid gap-4 ${mobileGridColsClassName} md:grid-cols-[repeat(var(--cards-per-row),minmax(0,1fr))]`}
        style={gridStyle}
      >
        {visibleCards.map((card, index) => (
          <motion.div
            key={card._id}
            initial={false}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: prefersReducedMotion ? 0 : Math.min(index * 0.02, 0.5),
            }}
          >
            <CardGridItem card={card} backCard={getBackCard(card) ?? undefined} />
          </motion.div>
        ))}
      </div>

      {hasMore ? <LoadMoreIndicator loadMoreRef={loadMoreRef} /> : null}
      {visibleCards.length === 0 ? <NoCardsFound /> : null}
    </CardNavigationProvider>
  );
}
