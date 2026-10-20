import type { Id } from "../../../../../convex/_generated/dataModel";
import type { BuilderLaneMap, BuilderTier } from "../types";
import { reconcileLaneMap } from "../utils";

/**
 * The catalog arrives in one batch (cache or sync), so it is ready once it has stopped loading
 * and holds cards. An empty catalog after a failed load is not ready: reconciling against it
 * would drop every placement.
 */
export function isTierListCardCatalogReady(catalog: { cards: readonly unknown[]; isCatalogDataLoading: boolean }) {
  return !catalog.isCatalogDataLoading && catalog.cards.length > 0;
}

export type TierListLaneMapSyncInput = {
  isCatalogReady: boolean;
  /** The tier list whose saved state (pool scopes, tiers, lanes) has been rendered. */
  hydratedTierListId: string | null;
  /** The tier list the detail query currently returns. */
  tierListId: string | null;
  sourceCardIds: Id<"cards">[];
  tiers: BuilderTier[];
};

/**
 * Fits the lane map to the pool's card source: prunes cards outside the pool and adds unplaced
 * pool cards to the pool lane. It leaves the lane map untouched until the catalog is ready and
 * the rendered state belongs to the current tier list, because the source is incomplete before
 * then and reconciling against it drops saved placements.
 */
export function syncTierListLaneMap(current: BuilderLaneMap, input: TierListLaneMapSyncInput): BuilderLaneMap {
  if (!input.isCatalogReady || input.hydratedTierListId === null || input.hydratedTierListId !== input.tierListId) {
    return current;
  }

  return reconcileLaneMap(input.sourceCardIds, input.tiers, current);
}
