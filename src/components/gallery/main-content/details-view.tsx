import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import type { CachedCard } from "@/lib/universus";
import { useInfiniteSlice } from "@/hooks/useInfiniteSlice";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CARDS_PER_PAGE } from "./constants";
import { useGalleryCardMap } from "./card-map-context";
import { CardDetailsListItem } from "./card-details-list-item";
import { LoadMoreIndicator } from "./load-more-indicator";
import { NoCardsFound } from "./no-cards-found";

interface GalleryDetailsViewProps {
  cards: CachedCard[];
}

export function GalleryDetailsView({ cards }: GalleryDetailsViewProps) {
  const isMobile = useIsMobile();
  const { getBackCard } = useGalleryCardMap();
  const { visibleItems: visibleCards, hasMore, loadMoreRef } = useInfiniteSlice({
    items: cards,
    pageSize: CARDS_PER_PAGE,
    rootMargin: isMobile ? "0px 0px 480px 0px" : undefined,
  });

  return (
    <CardNavigationProvider cards={cards} getBackCard={getBackCard}>
      <div className="space-y-6">
        {visibleCards.map((card) => (
          <div key={card._id} className="w-full">
            <CardDetailsListItem card={card} />
          </div>
        ))}
      </div>

      {hasMore ? <LoadMoreIndicator loadMoreRef={loadMoreRef} /> : null}
      {visibleCards.length === 0 ? <NoCardsFound /> : null}
    </CardNavigationProvider>
  );
}
