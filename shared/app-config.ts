export const COMMUNITY_TIER_RANKING = {
  scopes: {
    unranked: "unranked",
    global: "global",
    setScope: "set_scope",
  },
  globalScopeKey: "global",
  rankedTierCount: 6,
  rankedTierDefinitions: [
    { id: "tier-s", label: "S", color: "#f59e0b" },
    { id: "tier-a", label: "A", color: "#f97316" },
    { id: "tier-b", label: "B", color: "#a855f7" },
    { id: "tier-c", label: "C", color: "#3b82f6" },
    { id: "tier-d", label: "D", color: "#14b8a6" },
    { id: "tier-f", label: "F", color: "#64748b" },
  ],
  laneWeightGamma: 2,
  minimumVotesToRank: 5,
  smoothingK: 8,
  smoothingPriorMean: 0.5,
  generatedCommunityTiers: [
    { id: "community-s", label: "S", minimumScore: 0.85, color: "#f59e0b" },
    { id: "community-a", label: "A", minimumScore: 0.7, color: "#f97316" },
    { id: "community-b", label: "B", minimumScore: 0.55, color: "#a855f7" },
    { id: "community-c", label: "C", minimumScore: 0.4, color: "#3b82f6" },
    { id: "community-d", label: "D", minimumScore: 0, color: "#14b8a6" },
  ],
} as const;

export type CommunityTierRankingScope =
  (typeof COMMUNITY_TIER_RANKING.scopes)[keyof typeof COMMUNITY_TIER_RANKING.scopes];

export type RankedCommunityTierScope = Exclude<CommunityTierRankingScope, "unranked">;

type TierDefinition = {
  id: string;
  label: string;
  color: string;
  order?: number;
};

export function buildCanonicalRankedTiers(): Array<{ id: string; label: string; color: string; order: number }> {
  return COMMUNITY_TIER_RANKING.rankedTierDefinitions.map((tier, order) => ({
    ...tier,
    order,
  }));
}

export function isRankedTierScope(scope: CommunityTierRankingScope): scope is RankedCommunityTierScope {
  return scope !== COMMUNITY_TIER_RANKING.scopes.unranked;
}

export function normalizeScopeSetCodes(setCodes: string[]) {
  return Array.from(
    new Set(
      setCodes
        .map((code) => code.trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right))
    )
  );
}

export function normalizeSetScopeKey(setCodes: string[]) {
  return normalizeScopeSetCodes(setCodes).join("__");
}

export function resolveRankingScopeKey(scope: CommunityTierRankingScope, setCodes: string[]) {
  if (scope === COMMUNITY_TIER_RANKING.scopes.global) {
    return COMMUNITY_TIER_RANKING.globalScopeKey;
  }

  if (scope === COMMUNITY_TIER_RANKING.scopes.setScope) {
    return normalizeSetScopeKey(setCodes);
  }

  return COMMUNITY_TIER_RANKING.scopes.unranked;
}

export function getRankedLaneWeight(
  laneIndex: number,
  laneCount: number = COMMUNITY_TIER_RANKING.rankedTierCount
) {
  if (laneCount <= 1) {
    return 1;
  }

  const base = 1 - laneIndex / (laneCount - 1);
  return Number(base ** COMMUNITY_TIER_RANKING.laneWeightGamma);
}

export function isCanonicalRankedTierDefinitions(tiers: TierDefinition[]) {
  if (tiers.length !== COMMUNITY_TIER_RANKING.rankedTierDefinitions.length) {
    return false;
  }

  return COMMUNITY_TIER_RANKING.rankedTierDefinitions.every((expectedTier, index) => {
    const candidate = tiers[index];
    return (
      candidate?.id === expectedTier.id &&
      candidate?.label === expectedTier.label &&
      candidate?.color === expectedTier.color &&
      (candidate.order === undefined || candidate.order === index)
    );
  });
}

export function getRankingScopeLabel(scope: CommunityTierRankingScope) {
  switch (scope) {
    case COMMUNITY_TIER_RANKING.scopes.global:
      return "Global Ranked";
    case COMMUNITY_TIER_RANKING.scopes.setScope:
      return "Set-Scoped Ranked";
    default:
      return "Fun / Unranked";
  }
}

export function formatSetScopeLabel(setCodes: string[]) {
  const normalizedSetCodes = normalizeScopeSetCodes(setCodes);
  if (normalizedSetCodes.length === 0) {
    return "Set Scope Pending";
  }

  return normalizedSetCodes.join(" / ");
}


