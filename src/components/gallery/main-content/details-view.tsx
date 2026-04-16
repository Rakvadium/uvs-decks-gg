import { useVirtualizer } from "@tanstack/react-virtual";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import type { CachedCard } from "@/lib/universus/card-store";
import { useGalleryCardMap } from "./card-map-context";
import { CardDetailsListItem } from "./card-details-list-item";
import { useGalleryMainScrollRootRef } from "./gallery-main-scroll-root";
import { NoCardsFound } from "./no-cards-found";

interface GalleryDetailsViewProps {
  cards: CachedCard[];
  onOpenCardDetails: (card: CachedCard) => void;
}

export function GalleryDetailsView({ cards, onOpenCardDetails }: GalleryDetailsViewProps) {
  const scrollRef = useGalleryMainScrollRootRef();
  const { getBackCard } = useGalleryCardMap();

  const rowVirtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 420,
    overscan: 2,
    gap: 24,
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
                <CardDetailsListItem
                  card={card}
                  onOpenCardDetails={onOpenCardDetails}
                  imagePriority={virtualRow.index < 2}
                />
              </div>
            );
          })}
        </div>
      )}
    </CardNavigationProvider>
  );
}
