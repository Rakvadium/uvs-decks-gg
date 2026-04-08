import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, query, type MutationCtx } from "./_generated/server";
import { communityCardRankingValidator } from "./validators";
import {
  COMMUNITY_TIER_RANKING,
  buildCanonicalRankedTiers,
  formatSetScopeLabel,
  getRankedLaneWeight,
  isCanonicalRankedTierDefinitions,
  normalizeScopeSetCodes,
} from "../shared/app-config";

const communityScopeTypeValidator = v.union(v.literal("global"), v.literal("set_scope"));

const communityTierSnapshotTierValidator = v.object({
  id: v.string(),
  label: v.string(),
  color: v.string(),
  cardIds: v.array(v.id("cards")),
});

const communityScopeSummaryValidator = v.object({
  scopeType: communityScopeTypeValidator,
  scopeKey: v.string(),
  scopeLabel: v.string(),
  setCodes: v.array(v.string()),
  contributorCount: v.number(),
  rankedCardCount: v.number(),
  insufficientCardCount: v.number(),
  lastComputedAt: v.number(),
});

const communityScopeLeaderboardValidator = v.object({
  scopeType: communityScopeTypeValidator,
  scopeKey: v.string(),
  scopeLabel: v.string(),
  setCodes: v.array(v.string()),
  contributorCount: v.number(),
  rankedCardCount: v.number(),
  insufficientCardCount: v.number(),
  tiers: v.array(communityTierSnapshotTierValidator),
  rankedStats: v.array(communityCardRankingValidator),
  insufficientStats: v.array(communityCardRankingValidator),
  lastComputedAt: v.number(),
});

type RankedScopeType = "global" | "set_scope";

type EligibleScope = {
  scopeType: RankedScopeType;
  scopeKey: string;
  scopeLabel: string;
  setCodes: string[];
};

type AggregateAccumulator = {
  cardId: Id<"cards">;
  voteCount: number;
  sumScore: number;
  topLaneCount: number;
  bottomLaneCount: number;
};

function getEligibleScopeFromTierList(tierList: Doc<"tierLists">): EligibleScope | null {
  const rankingScope = tierList.rankingScope ?? COMMUNITY_TIER_RANKING.scopes.unranked;
  const rankingScopeKey = tierList.rankingScopeKey ?? "";

  if (!tierList.isPublic || !isCanonicalRankedTierDefinitions(tierList.tiers)) {
    return null;
  }

  if (rankingScope === COMMUNITY_TIER_RANKING.scopes.global) {
    return {
      scopeType: "global",
      scopeKey: COMMUNITY_TIER_RANKING.globalScopeKey,
      scopeLabel: "Global Rankings",
      setCodes: [],
    };
  }

  if (
    rankingScope === COMMUNITY_TIER_RANKING.scopes.setScope &&
    rankingScopeKey &&
    tierList.selectedSetCodes.length > 0
  ) {
    const setCodes = normalizeScopeSetCodes(tierList.selectedSetCodes);
    if (setCodes.length === 0) {
      return null;
    }

    return {
      scopeType: "set_scope",
      scopeKey: rankingScopeKey,
      scopeLabel: formatSetScopeLabel(setCodes),
      setCodes,
    };
  }

  return null;
}

async function clearScopeCache(ctx: MutationCtx, scopeType: RankedScopeType, scopeKey: string) {
  for await (const stat of ctx.db.query("communityCardRankings").withIndex("by_scope", (q) => q.eq("scopeType", scopeType).eq("scopeKey", scopeKey))) {
    await ctx.db.delete(stat._id);
  }

  for await (const snapshot of ctx.db.query("communityTierSnapshots").withIndex("by_scope", (q) => q.eq("scopeType", scopeType).eq("scopeKey", scopeKey))) {
    await ctx.db.delete(snapshot._id);
  }
}

async function getEligibleTierListsForScope(ctx: MutationCtx, scopeType: RankedScopeType, scopeKey: string) {
  const tierLists =
    scopeType === "global"
      ? await ctx.db
          .query("tierLists")
          .withIndex("by_isPublic_and_rankingScope_and_updatedAt", (q) =>
            q.eq("isPublic", true).eq("rankingScope", COMMUNITY_TIER_RANKING.scopes.global)
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("tierLists")
          .withIndex("by_isPublic_and_rankingScope_and_scopeKey_and_updatedAt", (q) =>
            q
              .eq("isPublic", true)
              .eq("rankingScope", COMMUNITY_TIER_RANKING.scopes.setScope)
              .eq("rankingScopeKey", scopeKey)
          )
          .order("desc")
          .collect();

  const latestByUser = new Map<string, Doc<"tierLists">>();
  for (const tierList of tierLists) {
    const eligibleScope = getEligibleScopeFromTierList(tierList);
    if (!eligibleScope || eligibleScope.scopeType !== scopeType || eligibleScope.scopeKey !== scopeKey) {
      continue;
    }

    const userKey = tierList.userId.toString();
    if (!latestByUser.has(userKey)) {
      latestByUser.set(userKey, tierList);
    }
  }

  return Array.from(latestByUser.values());
}

function buildCommunitySnapshot({
  now,
  scope,
  contributorCount,
  stats,
}: {
  now: number;
  scope: EligibleScope;
  contributorCount: number;
  stats: Array<{
    cardId: Id<"cards">;
    voteCount: number;
    rawMeanScore: number;
    adjustedScore: number;
    topLaneRate: number;
    bottomLaneRate: number;
  }>;
}) {
  const rankedStats = stats.filter(
    (entry) => entry.voteCount >= COMMUNITY_TIER_RANKING.minimumVotesToRank
  );
  const insufficientStats = stats.filter(
    (entry) => entry.voteCount < COMMUNITY_TIER_RANKING.minimumVotesToRank
  );

  const tierBuckets = new Map(
    COMMUNITY_TIER_RANKING.generatedCommunityTiers.map((tier) => [tier.id, [] as Id<"cards">[]])
  );

  for (const entry of [...rankedStats].sort((left, right) => right.adjustedScore - left.adjustedScore)) {
    const targetTier =
      COMMUNITY_TIER_RANKING.generatedCommunityTiers.find((tier) => entry.adjustedScore >= tier.minimumScore) ??
      COMMUNITY_TIER_RANKING.generatedCommunityTiers[COMMUNITY_TIER_RANKING.generatedCommunityTiers.length - 1];

    tierBuckets.get(targetTier.id)?.push(entry.cardId);
  }

  const tiers = COMMUNITY_TIER_RANKING.generatedCommunityTiers.map((tier) => ({
    id: tier.id,
    label: tier.label,
    color: tier.color,
    cardIds: tierBuckets.get(tier.id) ?? [],
  }));

  return {
    scopeType: scope.scopeType,
    scopeKey: scope.scopeKey,
    scopeLabel: scope.scopeLabel,
    setCodes: scope.setCodes,
    contributorCount,
    rankedCardCount: rankedStats.length,
    insufficientCardCount: insufficientStats.length,
    tiers,
    insufficientDataCardIds: insufficientStats
      .sort((left, right) => right.adjustedScore - left.adjustedScore)
      .map((entry) => entry.cardId),
    lastComputedAt: now,
  };
}

export const recomputeScope = internalMutation({
  args: {
    scopeType: communityScopeTypeValidator,
    scopeKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const canonicalRankedTiers = buildCanonicalRankedTiers();
    const targetScope: EligibleScope =
      args.scopeType === "global"
        ? {
            scopeType: "global",
            scopeKey: COMMUNITY_TIER_RANKING.globalScopeKey,
            scopeLabel: "Global Rankings",
            setCodes: [],
          }
        : {
            scopeType: "set_scope",
            scopeKey: args.scopeKey,
            scopeLabel: formatSetScopeLabel(args.scopeKey.split("__").filter(Boolean)),
            setCodes: args.scopeKey.split("__").filter(Boolean),
          };

    await clearScopeCache(ctx, args.scopeType, args.scopeKey);

    const tierLists = await getEligibleTierListsForScope(ctx, args.scopeType, args.scopeKey);
    if (tierLists.length === 0) {
      return null;
    }

    const aggregates = new Map<string, AggregateAccumulator>();

    for (const tierList of tierLists) {
      const tierItems = (await ctx.db
        .query("tierListItems")
        .withIndex("by_tierList", (q) => q.eq("tierListId", tierList._id))
        .collect()) as Doc<"tierListItems">[];

      const laneWeights = new Map(
        canonicalRankedTiers.map((tier, index) => [tier.id, getRankedLaneWeight(index, canonicalRankedTiers.length)])
      );
      const topLaneKey = canonicalRankedTiers[0]?.id;
      const bottomLaneKey = canonicalRankedTiers[canonicalRankedTiers.length - 1]?.id;

      for (const item of tierItems) {
        if (item.laneKey === "pool") {
          continue;
        }

        const laneWeight = laneWeights.get(item.laneKey);
        if (laneWeight === undefined) {
          continue;
        }

        const cardKey = item.cardId.toString();
        const current = aggregates.get(cardKey) ?? {
          cardId: item.cardId,
          voteCount: 0,
          sumScore: 0,
          topLaneCount: 0,
          bottomLaneCount: 0,
        };

        current.voteCount += 1;
        current.sumScore += laneWeight;
        if (item.laneKey === topLaneKey) {
          current.topLaneCount += 1;
        }
        if (item.laneKey === bottomLaneKey) {
          current.bottomLaneCount += 1;
        }
        aggregates.set(cardKey, current);
      }
    }

    const now = Date.now();
    const stats = Array.from(aggregates.values()).map((entry) => {
      const rawMeanScore = entry.voteCount > 0 ? entry.sumScore / entry.voteCount : 0;
      const adjustedScore =
        (entry.voteCount / (entry.voteCount + COMMUNITY_TIER_RANKING.smoothingK)) * rawMeanScore +
        (COMMUNITY_TIER_RANKING.smoothingK /
          (entry.voteCount + COMMUNITY_TIER_RANKING.smoothingK)) *
          COMMUNITY_TIER_RANKING.smoothingPriorMean;

      return {
        scopeType: targetScope.scopeType,
        scopeKey: targetScope.scopeKey,
        scopeLabel: targetScope.scopeLabel,
        cardId: entry.cardId,
        voteCount: entry.voteCount,
        rawMeanScore,
        adjustedScore,
        topLaneRate: entry.voteCount > 0 ? entry.topLaneCount / entry.voteCount : 0,
        bottomLaneRate: entry.voteCount > 0 ? entry.bottomLaneCount / entry.voteCount : 0,
        lastComputedAt: now,
      };
    });

    const sortedStats = [...stats].sort((left, right) => right.adjustedScore - left.adjustedScore);
    for (const entry of sortedStats) {
      await ctx.db.insert("communityCardRankings", entry);
    }

    await ctx.db.insert(
      "communityTierSnapshots",
      buildCommunitySnapshot({
        now,
        scope: targetScope,
        contributorCount: tierLists.length,
        stats: sortedStats,
      })
    );

    return null;
  },
});

export const listSetScopes = query({
  args: {},
  returns: v.array(communityScopeSummaryValidator),
  handler: async (ctx) => {
    const snapshots = await ctx.db
      .query("communityTierSnapshots")
      .withIndex("by_scopeType_and_lastComputedAt", (q) => q.eq("scopeType", "set_scope"))
      .order("desc")
      .collect();

    return snapshots.map((snapshot) => ({
      scopeType: snapshot.scopeType,
      scopeKey: snapshot.scopeKey,
      scopeLabel: snapshot.scopeLabel,
      setCodes: snapshot.setCodes,
      contributorCount: snapshot.contributorCount,
      rankedCardCount: snapshot.rankedCardCount,
      insufficientCardCount: snapshot.insufficientCardCount,
      lastComputedAt: snapshot.lastComputedAt,
    }));
  },
});

export const getScopeLeaderboard = query({
  args: {
    scopeType: communityScopeTypeValidator,
    scopeKey: v.string(),
  },
  returns: v.union(communityScopeLeaderboardValidator, v.null()),
  handler: async (ctx, args) => {
    const snapshot = await ctx.db
      .query("communityTierSnapshots")
      .withIndex("by_scope", (q) => q.eq("scopeType", args.scopeType).eq("scopeKey", args.scopeKey))
      .unique();

    if (!snapshot) {
      return null;
    }

    const stats = await ctx.db
      .query("communityCardRankings")
      .withIndex("by_scope_and_adjustedScore", (q) => q.eq("scopeType", args.scopeType).eq("scopeKey", args.scopeKey))
      .order("desc")
      .collect();

    return {
      scopeType: snapshot.scopeType,
      scopeKey: snapshot.scopeKey,
      scopeLabel: snapshot.scopeLabel,
      setCodes: snapshot.setCodes,
      contributorCount: snapshot.contributorCount,
      rankedCardCount: snapshot.rankedCardCount,
      insufficientCardCount: snapshot.insufficientCardCount,
      tiers: snapshot.tiers,
      rankedStats: stats.filter((entry) => entry.voteCount >= COMMUNITY_TIER_RANKING.minimumVotesToRank),
      insufficientStats: stats.filter((entry) => entry.voteCount < COMMUNITY_TIER_RANKING.minimumVotesToRank),
      lastComputedAt: snapshot.lastComputedAt,
    };
  },
});
