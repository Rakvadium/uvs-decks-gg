import { describe, expect, test } from "bun:test";
import type { Id } from "../convex/_generated/dataModel";
import type { CachedCard } from "../src/lib/universus/card-store";
import type { BuilderLaneMap, BuilderTier } from "../src/components/community/tier-lists/types";
import {
  POOL_LANE_KEY,
  buildLaneMapFromItems,
  reconcileLaneMap,
  tierListCardMatchesPool,
} from "../src/components/community/tier-lists/utils";
import {
  isTierListCardCatalogReady,
  syncTierListLaneMap,
} from "../src/components/community/tier-lists/detail-view/lane-map-sync";
import { TIER_LIST_POOL_ALL_TYPES, type TierListPoolScope } from "../shared/tier-list-pool";

const id = (value: string) => value as Id<"cards">;

const TIER_LIST_ID = "tier-list-1";
const tiers: BuilderTier[] = [
  { id: "tier-s", label: "S", color: "#f97316" },
  { id: "tier-a", label: "A", color: "#a855f7" },
];
const poolScopes: TierListPoolScope[] = [{ setCode: "SET1", cardType: TIER_LIST_POOL_ALL_TYPES }];

function card(cardId: string, setCode: string): CachedCard {
  return { _id: id(cardId), name: cardId, setCode, isFrontFace: true } as unknown as CachedCard;
}

const catalog = [card("c1", "SET1"), card("c2", "SET1"), card("c3", "SET1"), card("c4", "SET1"), card("x1", "SET2")];

const savedItems = [
  { cardId: id("c1"), laneKey: "tier-s", order: 0 },
  { cardId: id("c2"), laneKey: "tier-s", order: 1 },
  { cardId: id("c3"), laneKey: "tier-a", order: 0 },
];

/** What the hydrate effect writes into the lane map from the tier list detail. */
function hydratedLaneMap(items = savedItems): BuilderLaneMap {
  return reconcileLaneMap(
    items.map((item) => item.cardId),
    tiers,
    buildLaneMapFromItems(items, tiers)
  );
}

/** The hook's `sourceCardIds`: catalog cards inside the pool scopes. */
function sourceCardIds(cards: CachedCard[], scopes: TierListPoolScope[]) {
  return cards.filter((entry) => tierListCardMatchesPool(entry, scopes)).map((entry) => entry._id);
}

/**
 * One render's view of the hook state, as the reconcile effect's closure sees it. `hydrated` is
 * true once the hydrate effect's state (tier list id, pool scopes, tiers) has been rendered.
 */
function render(options: { cards: CachedCard[]; isCatalogDataLoading: boolean; hydrated: boolean }) {
  return {
    isCatalogReady: isTierListCardCatalogReady({
      cards: options.cards,
      isCatalogDataLoading: options.isCatalogDataLoading,
    }),
    hydratedTierListId: options.hydrated ? TIER_LIST_ID : null,
    tierListId: TIER_LIST_ID,
    sourceCardIds: options.hydrated ? sourceCardIds(options.cards, poolScopes) : [],
    tiers,
  };
}

function laneCounts(laneMap: BuilderLaneMap) {
  return Object.fromEntries(Object.entries(laneMap).map(([laneKey, cardIds]) => [laneKey, cardIds.length]));
}

describe("isTierListCardCatalogReady", () => {
  test("is not ready while loading, or when loading ended with no cards", () => {
    expect(isTierListCardCatalogReady({ cards: [], isCatalogDataLoading: true })).toBe(false);
    expect(isTierListCardCatalogReady({ cards: catalog, isCatalogDataLoading: true })).toBe(false);
    expect(isTierListCardCatalogReady({ cards: [], isCatalogDataLoading: false })).toBe(false);
  });

  test("is ready once loading ended with cards", () => {
    expect(isTierListCardCatalogReady({ cards: catalog, isCatalogDataLoading: false })).toBe(true);
  });
});

describe("syncTierListLaneMap", () => {
  test("root cause: reconciling against a catalog that has not loaded drops every placement", () => {
    const dropped = reconcileLaneMap([], tiers, hydratedLaneMap());
    expect(laneCounts(dropped)).toEqual({ [POOL_LANE_KEY]: 0, "tier-s": 0, "tier-a": 0 });
  });

  test("catalog late: placements survive until the catalog loads, then unplaced pool cards join the pool", () => {
    let laneMap = hydratedLaneMap();

    // Commit where the hydrate effect runs: its closure still has the pre-hydrate state.
    laneMap = syncTierListLaneMap(laneMap, render({ cards: [], isCatalogDataLoading: true, hydrated: false }));
    // Hydrated state rendered, catalog still loading.
    laneMap = syncTierListLaneMap(laneMap, render({ cards: [], isCatalogDataLoading: true, hydrated: true }));
    expect(laneMap).toEqual(hydratedLaneMap());

    // Catalog arrives.
    laneMap = syncTierListLaneMap(laneMap, render({ cards: catalog, isCatalogDataLoading: false, hydrated: true }));
    expect(laneMap["tier-s"]).toEqual([id("c1"), id("c2")]);
    expect(laneMap["tier-a"]).toEqual([id("c3")]);
    expect(laneMap[POOL_LANE_KEY]).toEqual([id("c4")]);
  });

  test("catalog late: a failed load that leaves no cards keeps the placements", () => {
    const laneMap = syncTierListLaneMap(hydratedLaneMap(), render({ cards: [], isCatalogDataLoading: false, hydrated: true }));
    expect(laneMap).toEqual(hydratedLaneMap());
  });

  test("catalog early: the hydrate commit is skipped, then the hydrated render reconciles with the real pool", () => {
    let laneMap = hydratedLaneMap();

    // Catalog already loaded (client-side navigation), but this closure predates the hydrated pool scopes.
    laneMap = syncTierListLaneMap(laneMap, render({ cards: catalog, isCatalogDataLoading: false, hydrated: false }));
    expect(laneMap).toEqual(hydratedLaneMap());

    laneMap = syncTierListLaneMap(laneMap, render({ cards: catalog, isCatalogDataLoading: false, hydrated: true }));
    expect(laneMap["tier-s"]).toEqual([id("c1"), id("c2")]);
    expect(laneMap["tier-a"]).toEqual([id("c3")]);
    expect(laneMap[POOL_LANE_KEY]).toEqual([id("c4")]);
  });

  test("does not reconcile a lane map hydrated from a different tier list", () => {
    const laneMap = hydratedLaneMap();
    const next = syncTierListLaneMap(laneMap, {
      ...render({ cards: catalog, isCatalogDataLoading: false, hydrated: true }),
      tierListId: "tier-list-2",
    });
    expect(next).toBe(laneMap);
  });

  test("a genuinely out-of-scope card is pruned once the catalog has loaded", () => {
    const items = [...savedItems, { cardId: id("x1"), laneKey: "tier-a", order: 1 }];
    let laneMap = hydratedLaneMap(items);

    laneMap = syncTierListLaneMap(laneMap, render({ cards: [], isCatalogDataLoading: true, hydrated: true }));
    expect(laneMap["tier-a"]).toEqual([id("c3"), id("x1")]);

    laneMap = syncTierListLaneMap(laneMap, render({ cards: catalog, isCatalogDataLoading: false, hydrated: true }));
    expect(laneMap["tier-s"]).toEqual([id("c1"), id("c2")]);
    expect(laneMap["tier-a"]).toEqual([id("c3")]);
    expect(laneMap[POOL_LANE_KEY]).toEqual([id("c4")]);
  });

  test("a card removed from the pool scopes by the owner is pruned", () => {
    const laneMap = syncTierListLaneMap(hydratedLaneMap(), {
      ...render({ cards: catalog, isCatalogDataLoading: false, hydrated: true }),
      sourceCardIds: [id("c1"), id("c3")],
    });
    expect(laneMap["tier-s"]).toEqual([id("c1")]);
    expect(laneMap["tier-a"]).toEqual([id("c3")]);
    expect(laneMap[POOL_LANE_KEY]).toEqual([]);
  });
});
