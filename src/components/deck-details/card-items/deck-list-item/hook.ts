import { useMemo } from "react";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { useDeckCardsSectionContext } from "../../deck-details-cards-section-context";
import { getZoneTintClass, getZoneTone } from "../../deck-list-utils";
import { useCardDetailsDialogTrigger, useDeckSectionCounts } from "../hooks";
import type { DeckListItemProps } from "./types";

export function useDeckListItemModel({ entry }: DeckListItemProps) {
  const deckDetails = useDeckDetailsOptional();
  const isOwner = deckDetails?.isOwner ?? false;
  const { activeSection, listSortKey, onHoverListCard, onClearListCardHover } = useDeckCardsSectionContext();
  const { card, quantity, backCard, typeKey } = entry;
  const { addCard, removeCard } = useDeckEditor();
  const sectionCounts = useDeckSectionCounts();
  const { isDialogOpen, setIsDialogOpen, openDialog, handleKeyDownOpen } = useCardDetailsDialogTrigger();

  const isAttackType = typeKey === "Attack";
  const zoneTone =
    listSortKey === "blockZone"
      ? getZoneTone(card.blockZone)
      : listSortKey === "attackZone" && isAttackType
        ? getZoneTone(card.attackZone)
        : null;

  const canAdd = useMemo(
    () =>
      canAddCardToSection({
        card,
        cardId: card._id,
        section: activeSection,
        counts: sectionCounts,
      }),
    [card, activeSection, sectionCounts]
  );

  return {
    card,
    quantity,
    backCard,
    isOwner,
    sortKey: listSortKey,
    section: activeSection,
    isAttackType,
    zoneTone,
    zoneTintClass: getZoneTintClass(zoneTone),
    canAdd,
    addCard,
    removeCard,
    isDialogOpen,
    setIsDialogOpen,
    openDialog,
    handleKeyDownOpen,
    onHoverCard: onHoverListCard,
    onClearHover: onClearListCardHover,
  };
}

export type DeckListItemModel = ReturnType<typeof useDeckListItemModel>;
