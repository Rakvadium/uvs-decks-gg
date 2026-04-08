import type { Id } from "../../../../convex/_generated/dataModel";
import type { CachedCard } from "@/lib/universus";
import type { BuilderLaneMap, BuilderTier } from "./types";
import {
  buildCanonicalRankedTiers,
  COMMUNITY_TIER_RANKING,
  isCanonicalRankedTierDefinitions,
  type CommunityTierRankingScope,
  getRankingScopeLabel,
} from "../../../../shared/app-config";

export const POOL_LANE_KEY = "pool";

export const TIER_COLOR_SWATCHES = [
  "#f97316",
  "#a855f7",
  "#3b82f6",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#64748b",
] as const;

export function createDefaultTiers(): BuilderTier[] {
  return [
    { id: "tier-a", label: "A", color: "#f97316" },
    { id: "tier-b", label: "B", color: "#a855f7" },
    { id: "tier-c", label: "C", color: "#3b82f6" },
    { id: "tier-d", label: "D", color: "#14b8a6" },
  ];
}

export function createCanonicalRankedTiers(): BuilderTier[] {
  return buildCanonicalRankedTiers().map(({ id, label, color }) => ({
    id,
    label,
    color,
  }));
}

export function isRankedTierListScope(scope: CommunityTierRankingScope | undefined) {
  return scope === COMMUNITY_TIER_RANKING.scopes.global || scope === COMMUNITY_TIER_RANKING.scopes.setScope;
}

export function isCanonicalRankedTierList(tiers: BuilderTier[]) {
  return isCanonicalRankedTierDefinitions(tiers);
}

export function getTierListScopeLabel(scope: CommunityTierRankingScope | undefined) {
  return getRankingScopeLabel(scope ?? COMMUNITY_TIER_RANKING.scopes.unranked);
}

export function getTierLaneKeys(tiers: BuilderTier[]) {
  return [POOL_LANE_KEY, ...tiers.map((tier) => tier.id)];
}

export function reconcileLaneMap(
  availableCardIds: Id<"cards">[],
  tiers: BuilderTier[],
  previousLaneMap?: BuilderLaneMap
) {
  const validCardIds = new Set(availableCardIds.map((cardId) => cardId.toString()));
  const nextLaneMap: BuilderLaneMap = Object.fromEntries(
    getTierLaneKeys(tiers).map((laneKey) => [laneKey, [] as Id<"cards">[]])
  );
  const placedCardIds = new Set<string>();

  if (previousLaneMap) {
    for (const laneKey of getTierLaneKeys(tiers)) {
      const laneCards = previousLaneMap[laneKey] ?? [];
      nextLaneMap[laneKey] = laneCards.filter((cardId) => {
        const key = cardId.toString();
        if (!validCardIds.has(key) || placedCardIds.has(key)) {
          return false;
        }
        placedCardIds.add(key);
        return true;
      });
    }
  }

  for (const cardId of availableCardIds) {
    const key = cardId.toString();
    if (!placedCardIds.has(key)) {
      nextLaneMap[POOL_LANE_KEY].push(cardId);
      placedCardIds.add(key);
    }
  }

  return nextLaneMap;
}

export function serializeLaneMap(laneMap: BuilderLaneMap, tiers: BuilderTier[]) {
  const serialized: Array<{ cardId: Id<"cards">; laneKey: string; order: number }> = [];

  for (const laneKey of getTierLaneKeys(tiers)) {
    const cardIds = laneMap[laneKey] ?? [];
    cardIds.forEach((cardId, order) => {
      serialized.push({
        cardId,
        laneKey,
        order,
      });
    });
  }

  return serialized;
}

export function buildLaneMapFromItems(
  items: Array<{ cardId: Id<"cards">; laneKey: string; order: number }>,
  tiers: BuilderTier[]
) {
  const nextLaneMap: BuilderLaneMap = Object.fromEntries(
    getTierLaneKeys(tiers).map((laneKey) => [laneKey, [] as Id<"cards">[]])
  );

  const sortedItems = [...items].sort((left, right) => left.order - right.order);
  for (const item of sortedItems) {
    const laneKey = nextLaneMap[item.laneKey] ? item.laneKey : POOL_LANE_KEY;
    nextLaneMap[laneKey].push(item.cardId);
  }

  return nextLaneMap;
}

export function buildCardMap(cards: CachedCard[]) {
  return new Map(cards.map((card) => [card._id.toString(), card]));
}

export function getBackCard(cardMap: Map<string, CachedCard>, card: CachedCard) {
  if (!card.backCardId) {
    return undefined;
  }

  return cardMap.get(card.backCardId.toString());
}
