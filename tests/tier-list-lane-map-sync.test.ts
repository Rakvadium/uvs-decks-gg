import { describe, expect, test } from "bun:test";
import type { Id } from "../convex/_generated/dataModel";
import type { BuilderLaneMap, BuilderTier } from "../src/components/community/tier-lists/types";
import { POOL_LANE_KEY } from "../src/components/community/tier-lists/utils";
import {
  getTierListCatalogState,
  reconcileTierListLaneMap,
  syncTierListLaneMap,
} from "../src/components/community/tier-lists/detail-view/lane-map-sync";

const id = (value: string) => value as Id<"cards">;
const tiers: BuilderTier[] = [
  { id: "tier-s", label: "S", color: "#f97316" },
  { id: "tier-a", label: "A", color: "#a855f7" },
];
const saved = (): BuilderLaneMap => ({ [POOL_LANE_KEY]: [], "tier-s": [id("c1"), id("x1")], "tier-a": [id("c2"), id("u1")] });
const known = new Set(["c1", "c2", "c3", "x1"]);
const source = [id("c1"), id("c2"), id("c3")];

describe("getTierListCatalogState", () => {
  const base = { cards: [1], isCatalogDataLoading: false, isCheckingVersion: false, cachedVersion: 29, serverVersion: 29 };

  test("unavailable while loading, or when loading ended with no cards", () => {
    expect(getTierListCatalogState({ ...base, isCatalogDataLoading: true })).toBe("unavailable");
    expect(getTierListCatalogState({ ...base, cards: [] })).toBe("unavailable");
  });

  test("outdated until the version check finds the cached version equal to the server's", () => {
    expect(getTierListCatalogState({ ...base, isCheckingVersion: true })).toBe("outdated");
    expect(getTierListCatalogState({ ...base, cachedVersion: 28 })).toBe("outdated");
    expect(getTierListCatalogState({ ...base, cachedVersion: null })).toBe("outdated");
    expect(getTierListCatalogState({ ...base, serverVersion: null })).toBe("outdated");
  });

  test("current when the versions match", () => {
    expect(getTierListCatalogState(base)).toBe("current");
  });
});

describe("reconcileTierListLaneMap", () => {
  test("without prune, keeps every placement and adds unplaced pool cards", () => {
    const next = reconcileTierListLaneMap(saved(), { sourceCardIds: source, tiers, knownCardIds: known, prune: false });
    expect(next).toEqual({ [POOL_LANE_KEY]: [id("c3")], "tier-s": [id("c1"), id("x1")], "tier-a": [id("c2"), id("u1")] });
  });

  test("with prune, drops only known cards outside the pool and keeps unknown ids in their lanes", () => {
    const next = reconcileTierListLaneMap(saved(), { sourceCardIds: source, tiers, knownCardIds: known, prune: true });
    expect(next).toEqual({ [POOL_LANE_KEY]: [id("c3")], "tier-s": [id("c1")], "tier-a": [id("c2"), id("u1")] });
  });

  test("drops duplicate placements, keeping the first", () => {
    const next = reconcileTierListLaneMap(
      { [POOL_LANE_KEY]: [id("c1")], "tier-s": [id("c1")], "tier-a": [] },
      { sourceCardIds: source, tiers, knownCardIds: known, prune: true }
    );
    expect(next).toEqual({ [POOL_LANE_KEY]: [id("c1"), id("c2"), id("c3")], "tier-s": [], "tier-a": [] });
  });
});

describe("syncTierListLaneMap", () => {
  const input = {
    catalogState: "current" as const,
    hydratedTierListId: "list-a",
    tierListId: "list-a",
    sourceCardIds: source,
    tiers,
    knownCardIds: known,
  };

  test("leaves the lane map alone while the catalog is unavailable", () => {
    const current = saved();
    expect(syncTierListLaneMap(current, { ...input, catalogState: "unavailable" })).toBe(current);
  });

  test("leaves the lane map alone until the current tier list's state has rendered", () => {
    const current = saved();
    expect(syncTierListLaneMap(current, { ...input, hydratedTierListId: null })).toBe(current);
    expect(syncTierListLaneMap(current, { ...input, tierListId: "list-b" })).toBe(current);
  });

  test("prunes only when the catalog is current", () => {
    expect(syncTierListLaneMap(saved(), { ...input, catalogState: "outdated" })["tier-s"]).toEqual([id("c1"), id("x1")]);
    expect(syncTierListLaneMap(saved(), input)["tier-s"]).toEqual([id("c1")]);
  });
});
