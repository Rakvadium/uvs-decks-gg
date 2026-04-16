import { useVirtualizer } from "@tanstack/react-virtual";
import { CardGridItem } from "@/components/universus/card-grid-item";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { CachedCard } from "@/lib/universus/card-store";
import { useGalleryCardMap } from "./card-map-context";
import { useGalleryMainScrollRootRef } from "./gallery-main-scroll-root";
import { NoCardsFound } from "./no-cards-found";

interface GalleryGridViewProps {
  cards: CachedCard[];
  cardsPerRow: number;
  onOpenCardDetails: (card: CachedCard) => void;
}

export function GalleryGridView({ cards, cardsPerRow, onOpenCardDetails }: GalleryGridViewProps) {
  const isMobile = useIsMobile();
  const scrollRef = useGalleryMainScrollRootRef();
  const { getBackCard } = useGalleryCardMap();
  const clampedCardsPerRow = Math.min(10, Math.max(1, Math.round(cardsPerRow)));
  const columnCount = isMobile ? (clampedCardsPerRow <= 1 ? 1 : 2) : clampedCardsPerRow;
  const rowCount = cards.length === 0 ? 0 : Math.ceil(cards.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 400,
    overscan: 3,
    gap: 16,
    getItemKey: (index) => {
      const first = cards[index * columnCount];
      return first?._id ?? index;
    },
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
            const startIndex = virtualRow.index * columnCount;
            const rowCards = cards.slice(startIndex, startIndex + columnCount);
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
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
                >
                  {rowCards.map((card) => (
                    <div key={card._id}>
                      <CardGridItem
                        card={card}
                        backCard={getBackCard(card) ?? undefined}
                        onOpenCardDetails={onOpenCardDetails}
                        imagePriority={virtualRow.index === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardNavigationProvider>
  );
}
