// Mounts useCommunityTierListDetailModel with React Testing Library on happy-dom, so the hook's
// real effect order runs. Convex, the router and the card catalog are replaced by an in-memory
// store the tests drive.
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { useSyncExternalStore } from "react";
import type { Id } from "../convex/_generated/dataModel";
import type { CachedCard } from "../src/lib/universus/card-store";
import { TIER_LIST_POOL_ALL_TYPES } from "../shared/tier-list-pool";

type Item = { cardId: Id<"cards">; laneKey: string; order: number };
type Detail = {
  tierList: {
    _id: string;
    title: string;
    description?: string;
    isPublic: boolean;
    rankingScope: "unranked";
    poolScopes: Array<{ setCode: string; cardType: string }>;
    selectedSetCodes: string[];
    tiers: Array<{ id: string; label: string; color: string; order: number }>;
  };
  items: Item[];
  canEdit: boolean;
};
type Catalog = {
  cards: CachedCard[];
  isCatalogDataLoading: boolean;
  isCheckingVersion: boolean;
  cachedVersion: number | null;
  serverVersion: number | null;
};
type SaveArgs = { tierListId: string; items: Item[] };

const id = (value: string) => value as Id<"cards">;
const card = (cardId: string, setCode: string): CachedCard =>
  ({ _id: id(cardId), name: cardId, setCode, collectorNumber: "1", isFrontFace: true }) as unknown as CachedCard;

const TIERS = ["S", "A", "B", "C", "D", "F"].map((label, order) => ({
  id: `tier-${label.toLowerCase()}`,
  label,
  color: "#f97316",
  order,
}));

/** 12 saved placements, S1 A4 B2 C1 D2 F2 like the seeded list, from 12 in-scope cards. */
function makeList(listId: string, prefix: string, setCode = "SET1", extra: Item[] = []): Detail {
  const lanes: Array<[string, number]> = [["tier-s", 1], ["tier-a", 4], ["tier-b", 2], ["tier-c", 1], ["tier-d", 2], ["tier-f", 2]];
  const items: Item[] = [];
  let n = 0;
  for (const [laneKey, count] of lanes) {
    for (let order = 0; order < count; order++) {
      items.push({ cardId: id(`${prefix}${++n}`), laneKey, order });
    }
  }
  return {
    tierList: {
      _id: listId,
      title: `List ${listId}`,
      isPublic: true,
      rankingScope: "unranked",
      poolScopes: [{ setCode, cardType: TIER_LIST_POOL_ALL_TYPES }],
      selectedSetCodes: [setCode],
      tiers: TIERS,
    },
    items: [...items, ...extra],
    canEdit: true,
  };
}

const LIST_A = "list-a";
const LIST_B = "list-b";
const OUT_OF_SCOPE = id("x1");
const A_CARDS = Array.from({ length: 12 }, (_, i) => card(`a${i + 1}`, "SET1"));
const B_CARDS = Array.from({ length: 12 }, (_, i) => card(`b${i + 1}`, "SET3"));
const B_POOL_CARDS = [card("q1", "SET3"), card("q2", "SET3")];
const POOL_CARDS = Array.from({ length: 4 }, (_, i) => card(`p${i + 1}`, "SET1"));
const FULL_CATALOG = [...A_CARDS, ...B_CARDS, ...POOL_CARDS, ...B_POOL_CARDS, card("x1", "SET2")];
/** A lane-A placement that a cache from before the latest release lacks. */
const MISSING_FROM_OLD_CACHE = id("a3");

const store = {
  version: 0,
  listeners: new Set<() => void>(),
  details: new Map<string, Detail | null | undefined>(),
  catalog: {} as Catalog,
  saves: [] as SaveArgs[],
};
function emit() {
  store.version += 1;
  for (const listener of store.listeners) listener();
}
function useStore() {
  return useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    () => store.version
  );
}
const saveTierList = (args: SaveArgs) => {
  store.saves.push(args);
  return Promise.resolve(null);
};
const noopMutation = () => Promise.resolve(null);
const router = { push: () => {}, replace: () => {}, back: () => {}, refresh: () => {}, prefetch: () => {} };
const noSets = { sets: [] };

mock.module("convex/react", () => ({
  useQuery: (_ref: unknown, args: { tierListId: string }) => {
    useStore();
    return store.details.get(args.tierListId);
  },
  useMutation: (ref: unknown) => {
    const name = String((ref as Record<symbol, unknown>)[Symbol.for("functionName")] ?? "");
    return name.endsWith("save") ? saveTierList : noopMutation;
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => router }));
mock.module("../src/lib/universus/card-data-provider", () => ({
  useCardCatalog: () => {
    useStore();
    return store.catalog;
  },
  useCardReferenceData: () => noSets,
}));

// The DOM globals must exist before React Testing Library and react-dom load. RTL registers its
// own act-environment hooks on import, so it is imported at the top level, not in a hook.
GlobalRegistrator.register();
const rtl = await import("@testing-library/react");
const { useCommunityTierListDetailModel: useModel } = await import(
  "../src/components/community/tier-lists/detail-view/hook"
);
type Model = ReturnType<typeof useModel>;

afterAll(async () => {
  rtl.cleanup();
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  rtl.cleanup();
  store.details = new Map();
  store.saves = [];
  store.catalog = loading();
});

function loading(): Catalog {
  return { cards: [], isCatalogDataLoading: true, isCheckingVersion: true, cachedVersion: null, serverVersion: null };
}
function current(cards = FULL_CATALOG): Catalog {
  return { cards, isCatalogDataLoading: false, isCheckingVersion: false, cachedVersion: 29, serverVersion: 29 };
}
function outdated(cards: CachedCard[]): Catalog {
  return { cards, isCatalogDataLoading: false, isCheckingVersion: false, cachedVersion: 28, serverVersion: 29 };
}

async function update(change: () => void) {
  await rtl.act(async () => {
    change();
    emit();
  });
}

function mount(listId = LIST_A) {
  return rtl.renderHook(({ tierListId }) => useModel(tierListId), { initialProps: { tierListId: listId } });
}

function lanes(model: Model) {
  return TIERS.map((tier) => (model.laneMap[tier.id] ?? []).length).join("/");
}
function pool(model: Model) {
  return (model.laneMap.pool ?? []).map(String);
}
/** How many of the list's saved (card, lane) placements a save payload still holds. */
function keptPlacements(save: SaveArgs, detail: Detail) {
  return detail.items.filter((saved) =>
    save.items.some((item) => item.cardId === saved.cardId && item.laneKey === saved.laneKey)
  ).length;
}

const SAVED_LANES = "1/4/2/1/2/2";

describe("useCommunityTierListDetailModel lane hydration", () => {
  test("cache older than the server, missing a lane card: the placement stays and a drag saves 12 of 12", async () => {
    const detail = makeList(LIST_A, "a");
    store.details.set(LIST_A, detail);
    const oldCache = FULL_CATALOG.filter((entry) => entry._id !== MISSING_FROM_OLD_CACHE);
    const { result } = mount();
    expect(lanes(result.current)).toBe(SAVED_LANES);

    await update(() => (store.catalog = outdated(oldCache)));
    expect(lanes(result.current)).toBe(SAVED_LANES);
    expect(result.current.laneMap["tier-a"]).toContain(MISSING_FROM_OLD_CACHE);
    expect(pool(result.current)).not.toContain(String(MISSING_FROM_OLD_CACHE));

    // The sync brings the newer catalog, which has the card.
    await update(() => (store.catalog = current()));
    expect(lanes(result.current)).toBe(SAVED_LANES);
    expect(result.current.laneMap["tier-a"]).toContain(MISSING_FROM_OLD_CACHE);
    expect(pool(result.current)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(store.saves).toHaveLength(0);

    await rtl.act(async () => result.current.moveCardToLane(id("p1"), "tier-s"));
    expect(store.saves).toHaveLength(1);
    expect(keptPlacements(store.saves[0], detail)).toBe(12);
    expect(store.saves[0].items).toContainEqual({ cardId: id("p1"), laneKey: "tier-s", order: 1 });
    expect(store.saves[0].items).toContainEqual({ cardId: MISSING_FROM_OLD_CACHE, laneKey: "tier-a", order: 1 });
  });

  test("a current catalog that doesn't know a saved card keeps it in its lane and saves it", async () => {
    const detail = makeList(LIST_A, "a");
    store.details.set(LIST_A, detail);
    store.catalog = current(FULL_CATALOG.filter((entry) => entry._id !== MISSING_FROM_OLD_CACHE));
    const { result } = mount();
    expect(lanes(result.current)).toBe(SAVED_LANES);

    await rtl.act(async () => result.current.moveCardToLane(id("p2"), "tier-f"));
    expect(keptPlacements(store.saves[0], detail)).toBe(12);
  });

  test("catalog late: placements show while it loads, then pool cards join the pool", async () => {
    const detail = makeList(LIST_A, "a");
    const { result } = mount();
    await update(() => store.details.set(LIST_A, detail));
    expect(lanes(result.current)).toBe(SAVED_LANES);
    expect(pool(result.current)).toEqual([]);

    await update(() => (store.catalog = current()));
    expect(lanes(result.current)).toBe(SAVED_LANES);
    expect(pool(result.current)).toEqual(["p1", "p2", "p3", "p4"]);

    await rtl.act(async () => {
      await result.current.persistTierList();
    });
    expect(keptPlacements(store.saves[0], detail)).toBe(12);
  });

  test("catalog early: the detail arrives after the catalog and keeps its placements", async () => {
    const detail = makeList(LIST_A, "a");
    store.catalog = current();
    const { result } = mount();
    expect(lanes(result.current)).toBe("0/0/0/0/0/0");

    await update(() => store.details.set(LIST_A, detail));
    expect(lanes(result.current)).toBe(SAVED_LANES);
    expect(pool(result.current)).toEqual(["p1", "p2", "p3", "p4"]);
  });

  test("catalog failed (loading ended with no cards): placements stay, nothing autosaves, Save keeps 12 of 12", async () => {
    const detail = makeList(LIST_A, "a");
    store.details.set(LIST_A, detail);
    const { result } = mount();
    await update(
      () => (store.catalog = { cards: [], isCatalogDataLoading: false, isCheckingVersion: false, cachedVersion: null, serverVersion: 29 })
    );
    expect(lanes(result.current)).toBe(SAVED_LANES);
    expect(store.saves).toHaveLength(0);

    await rtl.act(async () => {
      await result.current.persistTierList();
    });
    expect(keptPlacements(store.saves[0], detail)).toBe(12);
  });

  test("catalog empty at the current version: placements stay and Save keeps 12 of 12", async () => {
    const detail = makeList(LIST_A, "a");
    store.details.set(LIST_A, detail);
    const { result } = mount();
    await update(() => (store.catalog = current([])));
    expect(lanes(result.current)).toBe(SAVED_LANES);

    await rtl.act(async () => {
      await result.current.persistTierList();
    });
    expect(keptPlacements(store.saves[0], detail)).toBe(12);
  });

  test("an out-of-scope card is kept while the catalog is outdated and pruned once the matching version loads", async () => {
    const detail = makeList(LIST_A, "a", "SET1", [{ cardId: OUT_OF_SCOPE, laneKey: "tier-s", order: 1 }]);
    store.details.set(LIST_A, detail);
    const { result } = mount();
    expect(result.current.laneMap["tier-s"]).toEqual([id("a1"), OUT_OF_SCOPE]);

    await update(() => (store.catalog = { ...current(), isCheckingVersion: true }));
    expect(result.current.laneMap["tier-s"]).toEqual([id("a1"), OUT_OF_SCOPE]);

    await update(() => (store.catalog = outdated(FULL_CATALOG)));
    expect(result.current.laneMap["tier-s"]).toEqual([id("a1"), OUT_OF_SCOPE]);

    await update(() => (store.catalog = current()));
    expect(result.current.laneMap["tier-s"]).toEqual([id("a1")]);
    expect(lanes(result.current)).toBe(SAVED_LANES);

    await rtl.act(async () => result.current.moveCardToLane(id("p1"), "tier-a"));
    expect(store.saves[0].items.some((item) => item.cardId === OUT_OF_SCOPE)).toBe(false);
    expect(keptPlacements(store.saves[0], detail)).toBe(12);
  });

  test("list switching: B shows and saves B's placements, and going back shows A's", async () => {
    const detailA = makeList(LIST_A, "a");
    const detailB = makeList(LIST_B, "b", "SET3");
    // B's lanes differ from A's so a mix-up shows.
    detailB.items = detailB.items.map((item, index) => ({ ...item, laneKey: index < 6 ? "tier-s" : "tier-f", order: index }));
    store.details.set(LIST_A, detailA);
    const { result, rerender } = mount();
    expect(lanes(result.current)).toBe(SAVED_LANES);

    rerender({ tierListId: LIST_B });
    await update(() => store.details.set(LIST_B, detailB));
    expect(lanes(result.current)).toBe("6/0/0/0/0/6");

    rerender({ tierListId: LIST_A });
    expect(lanes(result.current)).toBe(SAVED_LANES);
    rerender({ tierListId: LIST_B });
    expect(lanes(result.current)).toBe("6/0/0/0/0/6");

    await update(() => (store.catalog = current()));
    expect(lanes(result.current)).toBe("6/0/0/0/0/6");
    expect(pool(result.current)).toEqual(["q1", "q2"]);

    await rtl.act(async () => result.current.moveCardToLane(id("q1"), "tier-b"));
    expect(store.saves).toHaveLength(1);
    expect(store.saves[0].tierListId).toBe(LIST_B);
    expect(keptPlacements(store.saves[0], detailB)).toBe(12);
    expect(keptPlacements(store.saves[0], detailA)).toBe(0);

    rerender({ tierListId: LIST_A });
    expect(lanes(result.current)).toBe(SAVED_LANES);
  });
});
