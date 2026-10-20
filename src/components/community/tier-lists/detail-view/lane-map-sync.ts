import type { Id } from "../../../../../convex/_generated/dataModel";
import type { BuilderLaneMap, BuilderTier } from "../types";
import { POOL_LANE_KEY, getTierLaneKeys } from "../utils";

/**
 * How far the lane map may trust the card catalog:
 * - `unavailable`: still loading, or loading ended with no cards (failed or empty). Leave lanes alone.
 * - `outdated`: cards are present, but the version check hasn't finished or found a newer server
 *   version. A cache from before a release can lack saved cards, and the newer catalog only arrives
 *   later through a sync. Add pool cards, but prune nothing.
 * - `current`: the cards match the server's catalog version. Cards the catalog knows that are
 *   outside the pool scopes can be pruned.
 */
export type TierListCatalogState = "unavailable" | "outdated" | "current";

export function getTierListCatalogState(catalog: {
  cards: readonly unknown[];
  isCatalogDataLoading: boolean;
  isCheckingVersion: boolean;
  cachedVersion: number | null;
  serverVersion: number | null;
}): TierListCatalogState {
  if (catalog.isCatalogDataLoading || catalog.cards.length === 0) {
    return "unavailable";
  }
  if (
    catalog.isCheckingVersion ||
    catalog.cachedVersion === null ||
    catalog.serverVersion === null ||
    catalog.cachedVersion !== catalog.serverVersion
  ) {
    return "outdated";
  }
  return "current";
}

/**
 * Fits the lane map to the pool: unplaced pool cards join the pool lane, and with `prune` a card
 * is dropped only when the catalog knows it and it is outside the pool. Ids the catalog doesn't
 * know stay in their lanes, so a catalog that lacks a card can never move or drop its placement.
 */
export function reconcileTierListLaneMap(
  current: BuilderLaneMap,
  options: {
    sourceCardIds: Id<"cards">[];
    tiers: BuilderTier[];
    knownCardIds: { has(cardId: string): boolean };
    prune: boolean;
  }
): BuilderLaneMap {
  const laneKeys = getTierLaneKeys(options.tiers);
  const inPool = new Set(options.sourceCardIds.map((cardId) => cardId.toString()));
  const placed = new Set<string>();
  const next: BuilderLaneMap = Object.fromEntries(laneKeys.map((laneKey) => [laneKey, [] as Id<"cards">[]]));

  for (const laneKey of laneKeys) {
    for (const cardId of current[laneKey] ?? []) {
      const key = cardId.toString();
      if (placed.has(key)) {
        continue;
      }
      if (options.prune && options.knownCardIds.has(key) && !inPool.has(key)) {
        continue;
      }
      placed.add(key);
      next[laneKey].push(cardId);
    }
  }

  for (const cardId of options.sourceCardIds) {
    const key = cardId.toString();
    if (!placed.has(key)) {
      placed.add(key);
      next[POOL_LANE_KEY].push(cardId);
    }
  }

  return next;
}

export type TierListLaneMapSyncInput = {
  catalogState: TierListCatalogState;
  /** The tier list whose saved state (pool scopes, tiers, lanes) has been rendered. */
  hydratedTierListId: string | null;
  /** The tier list the detail query currently returns. */
  tierListId: string | null;
  sourceCardIds: Id<"cards">[];
  tiers: BuilderTier[];
  knownCardIds: { has(cardId: string): boolean };
};

/**
 * Leaves the lane map untouched until the catalog has cards and the rendered state belongs to the
 * current tier list (before then the pool source is incomplete). Prunes only once the catalog
 * version is current.
 */
export function syncTierListLaneMap(current: BuilderLaneMap, input: TierListLaneMapSyncInput): BuilderLaneMap {
  if (
    input.catalogState === "unavailable" ||
    input.hydratedTierListId === null ||
    input.hydratedTierListId !== input.tierListId
  ) {
    return current;
  }

  return reconcileTierListLaneMap(current, {
    sourceCardIds: input.sourceCardIds,
    tiers: input.tiers,
    knownCardIds: input.knownCardIds,
    prune: input.catalogState === "current",
  });
}
