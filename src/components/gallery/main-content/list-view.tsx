import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import type { CachedCard } from "@/lib/universus";
import { useInfiniteSlice } from "@/hooks/useInfiniteSlice";
import { CARDS_PER_PAGE } from "./constants";
import { useGalleryCardMap } from "./card-map-context";
import { CardListItem } from "./card-list-item";
import { LoadMoreIndicator } from "./load-more-indicator";
import { NoCardsFound } from "./no-cards-found";

interface GalleryListViewProps {
  cards: CachedCard[];
}

export function GalleryListView({ cards }: GalleryListViewProps) {
  const { getBackCard } = useGalleryCardMap();
  const { visibleItems: visibleCards, hasMore, loadMoreRef } = useInfiniteSlice({
    items: cards,
    pageSize: CARDS_PER_PAGE,
  });

  return (
    <CardNavigationProvider cards={cards} getBackCard={getBackCard}>
      <div className="space-y-3">
        {visibleCards.map((card) => (
          <div key={card._id} className="w-full">
            <CardListItem card={card} />
          </div>
        ))}
      </div>

      {hasMore ? <LoadMoreIndicator loadMoreRef={loadMoreRef} /> : null}
      {visibleCards.length === 0 ? <NoCardsFound /> : null}
    </CardNavigationProvider>
  );
}
