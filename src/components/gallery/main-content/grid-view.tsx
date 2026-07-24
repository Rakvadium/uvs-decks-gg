import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CardGridItem } from "@/components/universus/card-grid-item";
import { galleryCardImageSizes } from "@/components/universus/card-grid-item/image-sizes";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { CachedCard } from "@/lib/universus/card-store";
import { useGalleryCardMap } from "./card-map-context";
import { useGalleryMainScrollElement } from "./gallery-main-scroll-root";
import {
  estimateGalleryGridRowHeight,
  GALLERY_GRID_GAP_PX,
  galleryVirtualRowStyle,
  useElementWidth,
  useScrollMargin,
} from "./gallery-virtualizer";
import { NoCardsFound } from "./no-cards-found";

interface GalleryGridViewProps {
  cards: CachedCard[];
  cardsPerRow: number;
  onOpenCardDetails: (card: CachedCard) => void;
}

export function GalleryGridView({ cards, cardsPerRow, onOpenCardDetails }: GalleryGridViewProps) {
  const isMobile = useIsMobile();
  const scrollElement = useGalleryMainScrollElement();
  const listRef = useRef<HTMLDivElement>(null);
  const { getBackCard } = useGalleryCardMap();
  const clampedCardsPerRow = Math.min(10, Math.max(1, Math.round(cardsPerRow)));
  const columnCount = isMobile ? (clampedCardsPerRow <= 1 ? 1 : 2) : clampedCardsPerRow;
  const rowCount = cards.length === 0 ? 0 : Math.ceil(cards.length / columnCount);
  const imageSizes = useMemo(() => galleryCardImageSizes(columnCount), [columnCount]);
  const rowWidth = useElementWidth(listRef, cards.length > 0);
  const scrollMargin = useScrollMargin(scrollElement, listRef);
  const rowHeight = estimateGalleryGridRowHeight(rowWidth, columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => rowHeight,
    overscan: 2,
    gap: GALLERY_GRID_GAP_PX,
    scrollMargin,
    getItemKey: (index) => {
      const first = cards[index * columnCount];
      return first?._id ?? index;
    },
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [columnCount, rowHeight, rowVirtualizer.measure]);

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
            const startIndex = virtualRow.index * columnCount;
            const rowCards = cards.slice(startIndex, startIndex + columnCount);
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                className="left-0 w-full [contain:layout_paint]"
                style={galleryVirtualRowStyle(virtualRow.start - scrollMargin)}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    gap: GALLERY_GRID_GAP_PX,
                  }}
                >
                  {rowCards.map((card) => (
                    <div key={card._id}>
                      <CardGridItem
                        card={card}
                        backCard={getBackCard(card) ?? undefined}
                        onOpenCardDetails={onOpenCardDetails}
                        imagePriority={virtualRow.index === 0}
                        imageSizes={imageSizes}
                        imageQuality={80}
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
