import { useCallback, useMemo, useState } from "react";
import { useSidebarWidth } from "@/components/shell/shell-slot-provider";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";

const SIDEBAR_GALLERY_PAGE_SIZE = 36;

export type SidebarGalleryViewMode = "card" | "list";

export function useGallerySidebarModel() {
  const gallery = useGalleryFiltersOptional();
  const shellSidebarWidthValue = useSidebarWidth();
  const isMobile = useIsMobile();
  const { cards: allCards } = useCardData();

  const [viewMode, setViewMode] = useState<SidebarGalleryViewMode>("card");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [visibleCountByKey, setVisibleCountByKey] = useState<Record<string, number>>({});
  const [hoveredListCardId, setHoveredListCardId] = useState<string | null>(null);

  const cardIdMap = useCardIdMap(allCards);

  const filterKey = useMemo(() => {
    if (!gallery) return `gallery-unavailable-${viewMode}`;

    return `${gallery.meta.filteredListKey}:${viewMode}`;
  }, [gallery, viewMode]);

  const visibleCount = visibleCountByKey[filterKey] ?? SIDEBAR_GALLERY_PAGE_SIZE;
  const visibleCards = gallery ? gallery.meta.filteredCards.slice(0, visibleCount) : [];
  const hasMore = gallery ? visibleCount < gallery.meta.filteredCards.length : false;

  const hoveredListCard =
    gallery && viewMode === "list" && hoveredListCardId
      ? visibleCards.find((card) => card._id === hoveredListCardId) ?? null
      : null;

  const loadMore = useCallback(() => {
    if (!gallery) return;

    setVisibleCountByKey((prev) => {
      const current = prev[filterKey] ?? SIDEBAR_GALLERY_PAGE_SIZE;
      return {
        ...prev,
        [filterKey]: Math.min(current + SIDEBAR_GALLERY_PAGE_SIZE, gallery.meta.filteredCards.length),
      };
    });
  }, [gallery, filterKey]);

  return {
    gallery,
    shellSidebarWidth: shellSidebarWidthValue,
    isMobile,
    viewMode,
    setViewMode,
    isFilterDialogOpen,
    setIsFilterDialogOpen,
    hoveredListCardId,
    setHoveredListCardId,
    hoveredListCard,
    cardIdMap,
    visibleCards,
    hasMore,
    loadMore,
  };
}

export type GallerySidebarModel = ReturnType<typeof useGallerySidebarModel>;
