"use client";

import { useMemo } from "react";
import { enabledDeckSections } from "@shared/games/features";
import { useGameFeatures } from "@/games/game-context";
import { DECK_SECTION_KEYS, type DeckSection } from "./display-config";

/** Deck sections the current game ships (`features.sideboard` / `features.referenceSection`). */
export function useEnabledDeckSections(): DeckSection[] {
  const features = useGameFeatures();
  return useMemo(() => enabledDeckSections(features), [features]);
}

/**
 * Sections to display: the enabled ones plus any disabled section that still holds cards
 * (legacy data), so those cards stay visible and can be moved out. Keeps display order.
 */
export function visibleDeckSections(
  enabled: readonly DeckSection[],
  sectionCount: (section: DeckSection) => number,
): DeckSection[] {
  return DECK_SECTION_KEYS.filter((key) => enabled.includes(key) || sectionCount(key) > 0);
}
