"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCardData } from "@/lib/universus/card-data-provider";
import { buildCardMap } from "../utils";
import { useGameId } from "@/games/game-context";

export function useCommunityTierListFeed(limit: number) {
  const game = useGameId();
  const feed = useQuery(api.tierLists.listPublicFeed, { game, limit });
  const { cards } = useCardData();

  return useMemo(
    () => ({
      feed,
      isLoading: feed === undefined,
      cardMap: buildCardMap(cards),
    }),
    [cards, feed]
  );
}
