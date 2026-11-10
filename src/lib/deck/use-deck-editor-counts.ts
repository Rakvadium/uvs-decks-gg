"use client";

import { useMemo } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useGameModule } from "@/games/game-context";
import type { CardIndex } from "@/lib/universus/card-store";
import { useEnsureCards } from "@/lib/universus/card-data-provider";
import { buildCopiesTowardLimit, type DeckSectionCounts } from "./card-eligibility";

/**
 * Section counts for a deck editor. Loads every card the deck references (sections, setup, cover)
 * that isn't in the gallery catalog — variant printings — and counts copy limits across printings.
 */
export function useDeckEditorCounts(
  deck: Doc<"decks"> | null | undefined,
  counts: Pick<DeckSectionCounts, "mainCounts" | "sideCounts" | "referenceCounts">,
  cardIndex: CardIndex | null,
): DeckSectionCounts {
  const { deck: deckModule } = useGameModule();
  const { mainCounts, sideCounts, referenceCounts } = counts;

  const referencedIds = useMemo(() => {
    if (!deck) return [];
    return [
      ...Object.keys(mainCounts),
      ...Object.keys(sideCounts),
      ...Object.keys(referenceCounts),
      ...deckModule.setupCardIds(deckModule.normalizeSetup(deck)),
      ...(deck.imageCardId ? [deck.imageCardId] : []),
    ];
  }, [deck, deckModule, mainCounts, sideCounts, referenceCounts]);
  useEnsureCards(referencedIds);

  return useMemo(
    () => ({
      mainCounts,
      sideCounts,
      referenceCounts,
      copiesTowardLimit: buildCopiesTowardLimit({ mainCounts, sideCounts }, (id) => cardIndex?.byId.get(id)),
    }),
    [mainCounts, sideCounts, referenceCounts, cardIndex]
  );
}
