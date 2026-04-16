import { useVirtualizer } from "@tanstack/react-virtual";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import type { CachedCard } from "@/lib/universus/card-store";
import { useGalleryCardMap } from "./card-map-context";
import { CardListItem } from "./card-list-item";
import { useGalleryMainScrollRootRef } from "./gallery-main-scroll-root";
import { NoCardsFound } from "./no-cards-found";

interface GalleryListViewProps {
  cards: CachedCard[];
  onOpenCardDetails: (card: CachedCard) => void;
}

export function GalleryListView({ cards, onOpenCardDetails }: GalleryListViewProps) {
  const scrollRef = useGalleryMainScrollRootRef();
  const { getBackCard } = useGalleryCardMap();

  const rowVirtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 108,
    overscan: 6,
    gap: 12,
    getItemKey: (index) => cards[index]?._id ?? index,
  });

  return (
    <CardNavigationProvider cards={cards} getBackCard={getBackCard}>
      {cards.length === 0 ? (
        <NoCardsFound />
      ) : (
        <div
          className="w-full"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const card = cards[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="left-0 w-full"
                style={{
                  position: "absolute",
                  top: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <CardListItem
                  card={card}
                  onOpenCardDetails={onOpenCardDetails}
                  thumbnailPriority={virtualRow.index < 8}
                />
              </div>
            );
          })}
        </div>
      )}
    </CardNavigationProvider>
  );
}
