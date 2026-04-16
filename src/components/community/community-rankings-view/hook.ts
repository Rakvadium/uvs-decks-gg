"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCardData } from "@/lib/universus";
import type { ScopeType } from "./types";

export function useCommunityRankingsModel() {
  const { cards } = useCardData();
  const setScopes = useQuery(api.communityRankings.listSetScopes, {});
  const [scopeType, setScopeType] = useState<ScopeType>("global");
  const [selectedSetScopeKey, setSelectedSetScopeKey] = useState("");

  const effectiveSetScopeKey = useMemo(() => {
    if (scopeType !== "set_scope") {
      return "";
    }
    if (selectedSetScopeKey) {
      return selectedSetScopeKey;
    }
    return setScopes?.[0]?.scopeKey ?? "";
  }, [scopeType, selectedSetScopeKey, setScopes]);

  const leaderboard = useQuery(api.communityRankings.getScopeLeaderboard, {
    scopeType,
    scopeKey: scopeType === "global" ? "global" : effectiveSetScopeKey || "__missing__",
  });

  const cardMap = useMemo(() => new Map(cards.map((card) => [card._id.toString(), card])), [cards]);

  const scopeItems = [
    { value: "global", label: "Global" },
    { value: "set_scope", label: "Set Scope", badge: setScopes?.length || undefined },
  ];

  return {
    setScopes,
    scopeType,
    setScopeType,
    selectedSetScopeKey: effectiveSetScopeKey,
    setSelectedSetScopeKey,
    leaderboard,
    cardMap,
    scopeItems,
  };
}
