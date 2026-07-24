import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import type { CachedCard } from "@/lib/universus/card-store";
import { useGalleryCardMap } from "./card-map-context";
import { CardListItem } from "./card-list-item";
import { useGalleryMainScrollElement } from "./gallery-main-scroll-root";
import { galleryVirtualRowStyle, useScrollMargin } from "./gallery-virtualizer";
import { NoCardsFound } from "./no-cards-found";

interface GalleryListViewProps {
  cards: CachedCard[];
  onOpenCardDetails: (card: CachedCard) => void;
}

export function GalleryListView({ cards, onOpenCardDetails }: GalleryListViewProps) {
  const scrollElement = useGalleryMainScrollElement();
  const listRef = useRef<HTMLDivElement>(null);
  const { getBackCard } = useGalleryCardMap();
  const scrollMargin = useScrollMargin(scrollElement, listRef);

  const rowVirtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 108,
    overscan: 6,
    gap: 12,
    scrollMargin,
    getItemKey: (index) => cards[index]?._id ?? index,
  });

  return (
    <CardNavigationProvider cards={cards} getBackCard={getBackCard}>
      {cards.length === 0 ? (
        <NoCardsFound />
      ) : (
        <div
          ref={listRef}
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
                className="left-0 w-full [contain:layout_paint]"
                style={galleryVirtualRowStyle(virtualRow.start - scrollMargin)}
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
