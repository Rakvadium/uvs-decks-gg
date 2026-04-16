"use client";

import { useCallback, useMemo, useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useCardData } from "@/lib/universus/card-data-provider";
import type { CachedCard } from "@/lib/universus/card-store";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import {
  CARD_TYPE_LABELS,
  CARD_TYPE_ORDER,
} from "@/lib/deck/display-config";
import { formatUniversusCardType } from "@/config/universus";
import { TCG_DND_ACCEPTS_CARD_ONLY, useTcgDroppable } from "@/lib/dnd";
import {
  LIST_SORT_SELECT_OPTIONS,
  LIST_VIEW_GROUPS,
  sortListEntries,
  supportsListSortDirection,
  type DeckListEntry,
  type DeckListSortKey,
  type DeckListSortSelectValue,
  type DeckViewMode,
  type ListSortDirection,
} from "./deck-list-utils";
import { SIDEBAR_SIDEBOARD_LIMIT } from "./uvs-import-export";

const EMPTY_QUANTITIES: Record<string, number> = {};

export function useDeckCardsSectionModel() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { cards: allCards } = useCardData();
  const { addCard } = useDeckEditor();
  const { deck, activeSection, isOwner, setActiveSection } = useDeckDetails();

  const [manualViewMode, setManualViewMode] = useState<DeckViewMode | null>(null);
  const [listSortKey, setListSortKey] = useState<DeckListSortKey>("difficulty");
  const [listSortDirection, setListSortDirection] = useState<ListSortDirection>("asc");
  const [hoveredCard, setHoveredCard] = useState<CachedCard | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

  const viewMode = manualViewMode ?? (isMobile ? "list" : "stacked");

  const cardIdMap = useCardIdMap(allCards);

  const mainCards = useMemo(() => {
    if (!deck) return [];
    return deck.mainCardIds.map((id) => cardIdMap.get(id)).filter(Boolean) as CachedCard[];
  }, [deck, cardIdMap]);

  const sideCards = useMemo(() => {
    if (!deck) return [];
    return deck.sideCardIds.map((id) => cardIdMap.get(id)).filter(Boolean) as CachedCard[];
  }, [deck, cardIdMap]);

  const referenceCards = useMemo(() => {
    if (!deck) return [];
    return deck.referenceCardIds.map((id) => cardIdMap.get(id)).filter(Boolean) as CachedCard[];
  }, [deck, cardIdMap]);

  const counts = useMemo(
    () => ({
      main: deck ? Object.values(deck.mainQuantities).reduce((sum, qty) => sum + qty, 0) : 0,
      side: deck ? Object.values(deck.sideQuantities).reduce((sum, qty) => sum + qty, 0) : 0,
      reference: deck ? Object.values(deck.referenceQuantities).reduce((sum, qty) => sum + qty, 0) : 0,
    }),
    [deck]
  );

  const isSideboardOverflow = counts.side > SIDEBAR_SIDEBOARD_LIMIT;

  const sectionCountsForDrop = useMemo(
    () => ({
      mainCounts: deck?.mainQuantities ?? {},
      sideCounts: deck?.sideQuantities ?? {},
      referenceCounts: deck?.referenceQuantities ?? {},
    }),
    [deck]
  );

  const currentCards = activeSection === "main" ? mainCards : activeSection === "side" ? sideCards : referenceCards;
  const currentQuantities = useMemo(() => {
    if (!deck) return EMPTY_QUANTITIES;
    if (activeSection === "main") return deck.mainQuantities;
    if (activeSection === "side") return deck.sideQuantities;
    return deck.referenceQuantities;
  }, [deck, activeSection]);

  const visibleCards = useMemo(() => {
    return currentCards.filter((card) => (currentQuantities[card._id.toString()] ?? 0) > 0);
  }, [currentCards, currentQuantities]);

  const sortedCards = useMemo(() => {
    const cardsCopy = [...visibleCards];
    cardsCopy.sort((a, b) => {
      const difficultyA = typeof a.difficulty === "number" ? a.difficulty : Number.POSITIVE_INFINITY;
      const difficultyB = typeof b.difficulty === "number" ? b.difficulty : Number.POSITIVE_INFINITY;
      if (difficultyA !== difficultyB) return difficultyA - difficultyB;
      return (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
    });
    return cardsCopy;
  }, [visibleCards]);

  const groupedCards = useMemo(() => {
    const groups = new Map<string, CachedCard[]>();
    for (const card of sortedCards) {
      const normalizedType = formatUniversusCardType(card.type) ?? card.type ?? "Other";
      const list = groups.get(normalizedType) ?? [];
      list.push(card);
      groups.set(normalizedType, list);
    }

    const orderedTypes = [
      ...CARD_TYPE_ORDER,
      ...Array.from(groups.keys())
        .filter((type) => !CARD_TYPE_ORDER.includes(type as (typeof CARD_TYPE_ORDER)[number]))
        .sort(),
    ];

    return orderedTypes
      .filter((type) => groups.has(type))
      .map((type) => ({
        type,
        label: CARD_TYPE_LABELS[type] ?? type,
        cards: groups.get(type) ?? [],
      }));
  }, [sortedCards]);

  const listGroups = useMemo(() => {
    const groupMap = new Map<string, DeckListEntry[]>();
    for (const group of LIST_VIEW_GROUPS) {
      groupMap.set(group.key, []);
    }

    for (const card of visibleCards) {
      const normalizedType = formatUniversusCardType(card.type) ?? card.type ?? "Other";
      const typeKey = groupMap.has(normalizedType) ? normalizedType : "Other";
      const quantity = currentQuantities[card._id.toString()] ?? 0;
      const backCard = card.backCardId ? cardIdMap.get(card.backCardId) : undefined;
      groupMap.get(typeKey)?.push({ card, quantity, backCard, typeKey });
    }

    const buildGroups = (column: "left" | "right") => {
      return LIST_VIEW_GROUPS.filter((group) => group.column === column)
        .map((group) => {
          const entries = groupMap.get(group.key) ?? [];
          const sortedEntries = sortListEntries(entries, listSortKey, listSortDirection, group.key);
          const total = sortedEntries.reduce((sum, entry) => sum + entry.quantity, 0);
          return {
            key: group.key,
            label: group.label,
            total,
            entries: sortedEntries,
          };
        })
        .filter((group) => group.entries.length > 0);
    };

    return {
      left: buildGroups("left"),
      right: buildGroups("right"),
    };
  }, [visibleCards, currentQuantities, cardIdMap, listSortKey, listSortDirection]);

  const handleDropToActiveSection = useCallback(
    (item: { card: CachedCard }) => {
      if (!deck) return;
      if (
        !canAddCardToSection({
          card: item.card,
          cardId: item.card._id,
          section: activeSection,
          counts: sectionCountsForDrop,
        })
      ) {
        return;
      }
      addCard(item.card._id as Id<"cards">, activeSection);
    },
    [activeSection, addCard, deck, sectionCountsForDrop]
  );

  const { isOver: isDeckDropOver, canDrop: canDropToActiveSection, droppableProps: deckDropProps } = useTcgDroppable({
    id: `deck-details-drop-${activeSection}`,
    accepts: TCG_DND_ACCEPTS_CARD_ONLY,
    onDrop: handleDropToActiveSection,
    isDisabled: !deck || !isOwner,
  });

  const selectedListSortValue = (
    supportsListSortDirection(listSortKey)
      ? `${listSortKey}:${listSortDirection}`
      : `${listSortKey}:asc`
  ) as DeckListSortSelectValue;

  const onSelectSort = useCallback((value: string) => {
    const selected = LIST_SORT_SELECT_OPTIONS.find((option) => option.value === value);
    if (!selected) return;
    setListSortKey(selected.key);
    setListSortDirection(selected.direction);
  }, []);

  const setViewMode = useCallback((mode: DeckViewMode) => {
    setManualViewMode(mode);
  }, []);

  const onHoverListCard = useCallback((card: CachedCard, rect: DOMRect) => {
    setHoveredCard(card);
    setHoveredRect(rect);
  }, []);

  const onClearListCardHover = useCallback(() => {
    setHoveredCard(null);
    setHoveredRect(null);
  }, []);

  return {
    deck,
    activeSection,
    setActiveSection,
    viewMode,
    setViewMode,
    listSortKey,
    listSortDirection,
    selectedListSortValue,
    onSelectSort,
    prefersReducedMotion,
    hoveredCard,
    hoveredRect,
    onHoverListCard,
    onClearListCardHover,
    counts,
    isSideboardOverflow,
    visibleCards,
    groupedCards,
    listGroups,
    currentQuantities,
    cardIdMap,
    canDropToActiveSection,
    isDeckDropOver,
    deckDropProps,
  };
}

export type DeckCardsSectionModel = ReturnType<typeof useDeckCardsSectionModel>;
