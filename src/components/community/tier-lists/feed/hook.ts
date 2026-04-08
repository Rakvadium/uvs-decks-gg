"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCardData } from "@/lib/universus";
import { buildCardMap } from "../utils";

export function useCommunityTierListFeed(limit: number) {
  const feed = useQuery(api.tierLists.listPublicFeed, { limit });
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
