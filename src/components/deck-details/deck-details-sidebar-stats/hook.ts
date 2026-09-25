import { useMemo } from "react";
import { useGameModule } from "@/games/game-context";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { buildDeckEntriesFromQuantities } from "../deck-list-utils";
import { buildDeckStatsChartData } from "./chart-data";

export function useStatsSidebarModel() {
  const context = useDeckDetailsOptional();
  const { formatCardType, deckStatsCharts } = useGameModule().ui;
  const { cards } = useCardData();
  const deck = context?.deck ?? null;
  const cardMap = useCardIdMap(cards);

  const mainEntries = useMemo(
    () => buildDeckEntriesFromQuantities(deck?.mainQuantities ?? {}, cardMap),
    [deck?.mainQuantities, cardMap]
  );

  const mainTotal = useMemo(
    () => mainEntries.reduce((sum, entry) => sum + entry.quantity, 0),
    [mainEntries]
  );

  // Charts come from the game module (UVS: type/difficulty/check/block/attack; Cyberpunk: cost/color/type).
  const charts = useMemo(
    () => buildDeckStatsChartData(deckStatsCharts, mainEntries, formatCardType),
    [deckStatsCharts, mainEntries, formatCardType]
  );

  return {
    deck,
    mainTotal,
    charts,
  };
}

export type StatsSidebarModel = ReturnType<typeof useStatsSidebarModel>;
