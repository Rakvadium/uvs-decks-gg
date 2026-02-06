import { useCallback } from "react";
import { canAddCardToSection, canMoveCardToSection } from "@/lib/deck";
import { useTcgDroppable } from "@/lib/dnd";
import {
  DECK_SECTION_META as SECTION_META,
  type DeckSection,
} from "@/lib/deck/display-config";
import type { CachedCard } from "@/lib/universus";
import { useActiveDeckSectionsContext } from "../sections-context";
import type { ActiveDeckSectionProps } from "./types";

export function useActiveDeckSectionModel({ sectionKey }: ActiveDeckSectionProps) {
  const {
    addCard,
    groupsBySection,
    moveCard,
    sectionCount,
    sectionCounts,
  } = useActiveDeckSectionsContext();

  const groups = groupsBySection[sectionKey];
  const currentSectionCount = sectionCount(sectionKey);
  const sectionMeta = SECTION_META[sectionKey];
  const Icon = sectionMeta.icon;

  const handleDrop = useCallback(
    (item: { card: CachedCard; sourceId?: string }) => {
      const sourceId = item.sourceId ?? "";
      const sourceSection = sourceId.startsWith("active-deck:")
        ? (sourceId.split(":")[1] as DeckSection)
        : null;

      if (sourceSection) {
        if (sourceSection === sectionKey) return;

        if (
          !canMoveCardToSection({
            card: item.card,
            cardId: item.card._id,
            fromSection: sourceSection,
            toSection: sectionKey,
            counts: sectionCounts,
          })
        ) {
          return;
        }

        moveCard(item.card._id, sourceSection, sectionKey);
        return;
      }

      if (
        !canAddCardToSection({
          card: item.card,
          cardId: item.card._id,
          section: sectionKey,
          counts: sectionCounts,
        })
      ) {
        return;
      }

      addCard(item.card._id, sectionKey);
    },
    [addCard, moveCard, sectionCounts, sectionKey]
  );

  const { isOver, canDrop, droppableProps } = useTcgDroppable({
    id: `active-deck-section-${sectionKey}`,
    accepts: ["card"],
    onDrop: handleDrop,
    isDisabled: false,
  });

  return {
    sectionKey,
    groups,
    currentSectionCount,
    sectionMeta,
    Icon,
    isOver,
    canDrop,
    droppableProps,
  };
}

export type ActiveDeckSectionModel = ReturnType<typeof useActiveDeckSectionModel>;
