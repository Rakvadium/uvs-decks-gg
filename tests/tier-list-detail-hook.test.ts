// Mounts useCommunityTierListDetailModel with React Testing Library on happy-dom, so the hook's
// real effect order runs. Convex, the router and the card catalog are replaced by an in-memory
// store the tests drive.
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useEffect, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
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

// bun's mock.module is process-wide and outlives this file, so each mock keeps the real module's
// other exports for test files that run later.
const realConvexReact = await import("convex/react");
const realNavigation = await import("next/navigation");
const realCardDataProvider = await import("../src/lib/universus/card-data-provider");

mock.module("convex/react", () => ({
  ...realConvexReact,
  useQuery: (_ref: unknown, args?: { tierListId?: string }) => {
    useStore();
    return args?.tierListId ? store.details.get(args.tierListId) : undefined;
  },
  useMutation: (ref: unknown) => {
    const name = String((ref as Record<symbol, unknown>)[Symbol.for("functionName")] ?? "");
    return name.endsWith("save") ? saveTierList : noopMutation;
  },
}));
mock.module("next/navigation", () => ({ ...realNavigation, useRouter: () => router }));
mock.module("../src/lib/universus/card-data-provider", () => ({
  ...realCardDataProvider,
  useCardCatalog: () => {
    useStore();
    return store.catalog;
  },
  useCardReferenceData: () => noSets,
}));
// Known cards render as a labelled stub, so the DOM tests can count tiles without the gallery's
// image pipeline.
mock.module("../src/components/universus/card-grid-item", () => ({
  CardGridItem: ({ card }: { card: CachedCard }) =>
    createElement("div", { role: "img", "aria-label": `Card ${String(card._id)}` }),
}));

// The DOM globals must exist before React Testing Library and react-dom load. RTL registers its
// own act-environment hooks on import, so it is imported at the top level, not in a hook.
GlobalRegistrator.register();
const rtl = await import("@testing-library/react");
const { useCommunityTierListDetailModel: useModel } = await import(
  "../src/components/community/tier-lists/detail-view/hook"
);
type Model = ReturnType<typeof useModel>;
const { TcgDndProvider } = await import("../src/lib/dnd");
const { CommunityTierListDetailProvider, useCommunityTierListDetailContext } = await import(
  "../src/components/community/tier-lists/detail-view/context"
);
const { CommunityTierListDetailBoard } = await import("../src/components/community/tier-lists/detail-view/board");
const { CommunityTierListDetailPoolPanel } = await import(
  "../src/components/community/tier-lists/detail-view/pool-panel"
);

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

/** The provider's latest value, published after each commit. */
const view: { model: Model | null } = { model: null };
function ViewProbe() {
  const model = useCommunityTierListDetailContext();
  useEffect(() => {
    view.model = model;
  });
  return null;
}

/** The real board and pool panel under the real provider, as the detail page renders them. */
function mountView(listId = LIST_A) {
  view.model = null;
  // The providers type `children` as a required prop; createElement passes it as an argument.
  const Dnd = TcgDndProvider as ComponentType<{ children?: ReactNode }>;
  const Detail = CommunityTierListDetailProvider as ComponentType<{ tierListId: string; children?: ReactNode }>;
  return rtl.render(
    createElement(
      Dnd,
      null,
      createElement(
        Detail,
        { tierListId: listId },
        createElement(ViewProbe),
        createElement(CommunityTierListDetailBoard),
        createElement(CommunityTierListDetailPoolPanel)
      )
    )
  );
}

const TILE_SELECTOR = '[aria-label^="Card "], [aria-label="Loading card"], [aria-label="Unavailable card"]';

/** Per lane: the badge count and what is actually rendered under it. */
function laneView(laneKey: string) {
  const lane = document.querySelector(`[data-tcg-drop-zone="tier-list-${laneKey}"]`);
  if (!lane) throw new Error(`lane ${laneKey} not rendered`);
  const badgeText = lane.querySelector("[data-slot=badge]")?.textContent?.trim() ?? "";
  const badge = Number(/^(\d+) cards$/.exec(badgeText)?.[1]);
  const tiles = [...lane.querySelectorAll(TILE_SELECTOR)].map((tile) => {
    const label = tile.getAttribute("aria-label") ?? "";
    return label.startsWith("Card ") ? "card" : label === "Loading card" ? "loading" : "unavailable";
  });
  return { badge, tiles, emptyMessage: /No cards in this lane|Drag cards here/.test(lane.textContent ?? "") };
}

function expectBadgesMatchTiles() {
  for (const tier of TIERS) {
    const view = laneView(tier.id);
    expect({ lane: tier.label, rendered: view.tiles.length }).toEqual({ lane: tier.label, rendered: view.badge });
  }
}

const withoutMissingCard = () => FULL_CATALOG.filter((entry) => entry._id !== MISSING_FROM_OLD_CACHE);

describe("tier list lanes render every counted card", () => {
  test("while the catalog loads, every placement is a same-size skeleton under a matching badge", () => {
    store.details.set(LIST_A, makeList(LIST_A, "a"));
    mountView();
    expectBadgesMatchTiles();
    expect(laneView("tier-a")).toEqual({ badge: 4, tiles: ["loading", "loading", "loading", "loading"], emptyMessage: false });
  });

  test("an outdated catalog missing a card shows a skeleton for it until the sync brings it", async () => {
    store.details.set(LIST_A, makeList(LIST_A, "a"));
    store.catalog = outdated(withoutMissingCard());
    mountView();
    expect(laneView("tier-a").tiles).toEqual(["card", "loading", "card", "card"]);
    expectBadgesMatchTiles();

    await update(() => (store.catalog = current()));
    expect(laneView("tier-a").tiles).toEqual(["card", "card", "card", "card"]);
    expectBadgesMatchTiles();
  });

  test("a current catalog that lacks a card shows an Unavailable tile the owner can remove", async () => {
    const detail = makeList(LIST_A, "a");
    store.details.set(LIST_A, detail);
    store.catalog = current(withoutMissingCard());
    mountView();
    expect(laneView("tier-a").tiles).toEqual(["card", "unavailable", "card", "card"]);
    expectBadgesMatchTiles();

    const remove = rtl.screen.getByRole("button", { name: "Remove unavailable card" });
    await rtl.act(async () => remove.click());
    expect(laneView("tier-a")).toEqual({ badge: 3, tiles: ["card", "card", "card"], emptyMessage: false });
    expect(store.saves).toHaveLength(1);
    expect(store.saves[0].items.some((item) => item.cardId === MISSING_FROM_OLD_CACHE)).toBe(false);
    expect(keptPlacements(store.saves[0], detail)).toBe(11);
  });

  test("an Unavailable tile moves with the owner's drop and stays visible in its new lane", async () => {
    store.details.set(LIST_A, makeList(LIST_A, "a"));
    store.catalog = current(withoutMissingCard());
    mountView();

    await rtl.act(async () => view.model!.moveCardToLane(MISSING_FROM_OLD_CACHE, "tier-f"));
    expect(laneView("tier-a").tiles).toEqual(["card", "card", "card"]);
    expect(laneView("tier-f").tiles).toEqual(["card", "card", "unavailable"]);
    expectBadgesMatchTiles();
    expect(store.saves[0].items).toContainEqual({ cardId: MISSING_FROM_OLD_CACHE, laneKey: "tier-f", order: 2 });
  });

  test("a lane whose only card is unknown shows its tile, not an empty lane", () => {
    store.details.set(LIST_A, makeList(LIST_A, "a"));
    store.catalog = current(FULL_CATALOG.filter((entry) => entry._id !== id("a1")));
    mountView();
    expect(laneView("tier-s")).toEqual({ badge: 1, tiles: ["unavailable"], emptyMessage: false });
  });

  test("guests see the Unavailable tile without a remove control", () => {
    store.details.set(LIST_A, { ...makeList(LIST_A, "a"), canEdit: false });
    store.catalog = current(withoutMissingCard());
    mountView();
    expect(laneView("tier-a").tiles).toEqual(["card", "unavailable", "card", "card"]);
    expect(rtl.screen.queryByRole("button", { name: "Remove unavailable card" })).toBeNull();
  });

  test("a failed catalog load shows Unavailable tiles under matching badges", () => {
    store.details.set(LIST_A, makeList(LIST_A, "a"));
    store.catalog = { cards: [], isCatalogDataLoading: false, isCheckingVersion: false, cachedVersion: null, serverVersion: 29 };
    mountView();
    expectBadgesMatchTiles();
    expect(laneView("tier-a").tiles).toEqual(["unavailable", "unavailable", "unavailable", "unavailable"]);
  });

  test("an unknown card in the pool is shown in the pool too", () => {
    store.details.set(LIST_A, makeList(LIST_A, "a", "SET1", [{ cardId: id("gone1"), laneKey: "pool", order: 0 }]));
    store.catalog = current();
    mountView();
    expect(view.model!.poolCardIds.map(String)).toContain("gone1");
    expect(rtl.screen.getAllByRole("group", { name: "Unavailable card" })).toHaveLength(1);
    expect(rtl.screen.getByText("5 cards waiting to be ranked")).toBeTruthy();
  });
});
