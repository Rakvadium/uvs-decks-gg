import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import type { CachedCard } from "@/lib/universus/card-store";
import { useGalleryCardMap } from "./card-map-context";
import { CardDetailsListItem } from "./card-details-list-item";
import { useGalleryMainScrollElement } from "./gallery-main-scroll-root";
import { galleryVirtualRowStyle, useScrollMargin } from "./gallery-virtualizer";
import { NoCardsFound } from "./no-cards-found";

interface GalleryDetailsViewProps {
  cards: CachedCard[];
  onOpenCardDetails: (card: CachedCard) => void;
}

export function GalleryDetailsView({ cards, onOpenCardDetails }: GalleryDetailsViewProps) {
  const scrollElement = useGalleryMainScrollElement();
  const listRef = useRef<HTMLDivElement>(null);
  const { getBackCard } = useGalleryCardMap();
  const scrollMargin = useScrollMargin(scrollElement, listRef);

  const rowVirtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 420,
    overscan: 2,
    gap: 24,
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
