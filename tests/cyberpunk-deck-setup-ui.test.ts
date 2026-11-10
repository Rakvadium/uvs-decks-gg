import { describe, expect, test } from "bun:test";
import { getSharedGameModule } from "@shared/games/registry";
import { parseCyberpunkDeckText, formatCyberpunkDeckText } from "@shared/games/cyberpunk/deck-text";
import { buildCardNameIndex, parseUvsUltraDeck } from "@shared/games/uvs/deck-text";
import { canAddCardToSection } from "@shared/games/uvs/card-eligibility";
import {
  applyLegendPick,
  buildLegendPickerOptions,
  legendDisplayName,
  resolveImportedLegends,
  resolveLegendAdd,
  type LegendCardLike,
} from "@/games/cyberpunk/components/deck/legend-model";
import { buildRamBudgetSummary } from "@/games/cyberpunk/components/deck/ram-budget-model";
import { CYBERPUNK_DECK_SETUP_HELPERS } from "@/games/cyberpunk/deck-setup";
import { CYBERPUNK_DECK_STATS_CHARTS } from "@/games/cyberpunk/deck-stats";
import { mainDeckTarget } from "@/games/main-deck-target";
import { UVS_DECK_SETUP_HELPERS } from "@/games/uvs/deck-setup";
import { UVS_DECK_STATS_CHARTS } from "@/games/uvs/deck-stats";
import {
  findCardsByName,
  setupExportCards,
} from "../src/components/deck-details/deck-details-sidebar-import-export/setup-text";
import {
  buildCurveDistribution,
  buildDeckStatsChartData,
} from "../src/components/deck-details/deck-details-sidebar-stats/chart-data";
import { buildSectionGroups } from "../src/components/gallery/active-deck-sidebar/build-section-groups";
import type { CachedCard } from "../src/lib/universus/card-store";
import type { GameDeckSetupHelpers } from "@/games/types";

function card(id: string, name: string, extra: Partial<CachedCard> = {}): CachedCard {
  return { _id: id, name, ...extra } as unknown as CachedCard;
}

const legend = (id: string, name: string, color: string, ram: number, extra: Partial<CachedCard> = {}) =>
  card(id, name, { type: "Legend", color, ram, ...extra });

const V = legend("v", "V", "red", 2, { subname: "Streetkid" });
const V2 = legend("v2", "V: Corpo", "blue", 1, { subname: "Corpo" });
const JOHNNY = legend("johnny", "Johnny Silverhand", "red", 1);
const PANAM = legend("panam", "Panam Palmer", "green", 3);
const JUDY = legend("judy", "Judy Alvarez", "blue", 2);
const VARIANT = legend("judy-alt", "Judy Alvarez", "blue", 2, { isVariant: true });
const MANTIS = card("mantis", "Mantis Blades", { type: "Gear", color: "red", ram: 3, cost: 2 });
const PISTOL = card("pistol", "Pistol", { type: "Gear", color: "red", ram: 1, cost: 1 });
const HACK = card("hack", "Short Circuit", { type: "Program", color: "blue", ram: 1, cost: 3 });
const DRONE = card("drone", "Drone", { type: "Unit", cost: 4 });

const ALL = [V, V2, JOHNNY, PANAM, JUDY, VARIANT, MANTIS, PISTOL, HACK, DRONE];
const byId = new Map(ALL.map((entry) => [entry._id as string, entry]));
const getCard = (id: string) => byId.get(id) as LegendCardLike | undefined;

describe("Legend picker options", () => {
  test("only Legend front faces, no variants, sorted by color then name", () => {
    const options = buildLegendPickerOptions({ cards: ALL, legendIds: [], getCard });
    expect(options.map((option) => String(option.card._id))).toEqual(["johnny", "v", "panam", "judy", "v2"]);
    expect(options.every((option) => option.disabledReason === null && !option.selected)).toBe(true);
  });

  test("search matches name + subname; color filter", () => {
    const search = buildLegendPickerOptions({ cards: ALL, legendIds: [], getCard, search: "streetkid" });
    expect(search.map((option) => String(option.card._id))).toEqual(["v"]);
    const blue = buildLegendPickerOptions({ cards: ALL, legendIds: [], getCard, colors: ["blue"] });
    expect(blue.map((option) => String(option.card._id))).toEqual(["judy", "v2"]);
  });

  test("toggle mode: duplicates by name disabled, full slots disable the rest", () => {
    const one = buildLegendPickerOptions({ cards: ALL, legendIds: ["v"], getCard });
    const v2 = one.find((option) => option.card._id === "v2");
    expect(v2?.disabledReason).toContain("already chosen");
    expect(one.find((option) => option.card._id === "v")).toMatchObject({ selected: true, disabledReason: null });

    const full = buildLegendPickerOptions({ cards: ALL, legendIds: ["v", "panam", "judy"], getCard });
    expect(full.find((option) => option.card._id === "johnny")?.disabledReason).toContain("full");
    expect(full.find((option) => option.card._id === "panam")?.disabledReason).toBeNull();
  });

  test("replace mode: the replaced Legend's name is free, other slots are taken", () => {
    const options = buildLegendPickerOptions({ cards: ALL, legendIds: ["v", "panam", "judy"], getCard, slotIndex: 0 });
    expect(options.find((option) => option.card._id === "v2")?.disabledReason).toBeNull();
    expect(options.find((option) => option.card._id === "johnny")?.disabledReason).toBeNull();
    expect(options.find((option) => option.card._id === "panam")?.disabledReason).toContain("Already");
    expect(options.find((option) => option.card._id === "v")).toMatchObject({ selected: true, disabledReason: null });
  });

  test("applyLegendPick toggles, appends, replaces, caps at 3", () => {
    expect(applyLegendPick([], "v")).toEqual(["v"]);
    expect(applyLegendPick(["v", "panam"], "v")).toEqual(["panam"]);
    expect(applyLegendPick(["v", "panam", "judy"], "johnny")).toEqual(["v", "panam", "judy"]);
    expect(applyLegendPick(["v", "panam", "judy"], "johnny", 1)).toEqual(["v", "johnny", "judy"]);
    expect(applyLegendPick(["v"], "panam", 2)).toEqual(["v", "panam"]);
  });

  test("display name appends a subname the name doesn't include", () => {
    expect(legendDisplayName(V)).toBe("V, Streetkid");
    expect(legendDisplayName(V2)).toBe("V: Corpo");
  });
});

describe("adding a Legend to the main deck", () => {
  test("offers the Legend slots, or explains why not", () => {
    expect(resolveLegendAdd(MANTIS, [], getCard)).toBeNull();
    expect(resolveLegendAdd(V, ["panam"], getCard)).toMatchObject({ kind: "add", legendIds: ["panam", "v"] });
    expect(resolveLegendAdd(V, ["v"], getCard)).toMatchObject({ kind: "blocked" });
    expect(resolveLegendAdd(V2, ["v"], getCard)?.message).toContain("different names");
    expect(resolveLegendAdd(JOHNNY, ["v", "panam", "judy"], getCard)?.message).toContain("full");
  });

  test("module helper returns a setup patch", () => {
    const resolution = CYBERPUNK_DECK_SETUP_HELPERS.resolveSetupAdd(V, { game: "cyberpunk", legendIds: [] }, (id) =>
      byId.get(id)
    );
    expect(resolution).toMatchObject({ kind: "add", patch: { game: "cyberpunk", legendIds: ["v"] } });
    const uvsHelpers: GameDeckSetupHelpers = UVS_DECK_SETUP_HELPERS;
    expect(uvsHelpers.resolveSetupAdd(V, { game: "uvs" }, () => undefined)).toBeNull();
  });

  test("Cyberpunk rules block Legends from main and allow typed cards (UVS default unchanged)", () => {
    const rules = getSharedGameModule("cyberpunk").deck;
    const counts = { mainCounts: { mantis: 3 }, sideCounts: {}, referenceCounts: {} };
    expect(canAddCardToSection({ card: V, cardId: "v", section: "main", counts, rules })).toBe(false);
    expect(canAddCardToSection({ card: PISTOL, cardId: "pistol", section: "main", counts, rules })).toBe(true);
    expect(canAddCardToSection({ card: MANTIS, cardId: "mantis", section: "main", counts, rules })).toBe(false);
    // Default (UVS) rules: no difficulty/check -> not addable.
    expect(canAddCardToSection({ card: PISTOL, cardId: "pistol", section: "main", counts })).toBe(false);
  });
});

describe("import / export setup cards", () => {
  const index = buildCardNameIndex(ALL);
  const find = (name: string) => findCardsByName(name, index);

  test("findCardsByName: exact first, then normalized", () => {
    expect(find("judy alvarez").map((entry) => String(entry._id))).toEqual(["judy", "judy-alt"]);
    expect(find("Johnny  Silverhand!").map((entry) => String(entry._id))).toEqual(["johnny"]);
    expect(find("Nobody")).toEqual([]);
  });

  test("Cyberpunk import applies parsed Legends as a setup patch", () => {
    const parsed = parseCyberpunkDeckText("Legends\n1 V\n1 Panam Palmer\n1 Nobody\n1 V\n\nDeck\n3 Mantis Blades");
    const result = CYBERPUNK_DECK_SETUP_HELPERS.importPatch(parsed, find);
    expect(result as unknown).toEqual({ patch: { game: "cyberpunk", legendIds: ["v", "panam"] }, unresolved: ["Nobody"] });
    expect(CYBERPUNK_DECK_SETUP_HELPERS.importPatch(parseCyberpunkDeckText("3 Mantis Blades"), find).patch).toBeNull();
  });

  test("Legend lines skip non-Legend matches and cap at 3", () => {
    const shadow = card("shadow", "Panam Palmer", { type: "Unit" });
    const result = resolveImportedLegends(
      [
        { name: "Panam Palmer", quantity: 1 },
        { name: "V", quantity: 1 },
        { name: "Judy Alvarez", quantity: 1 },
        { name: "Johnny Silverhand", quantity: 1 },
      ],
      (name) => (name === "Panam Palmer" ? [shadow, PANAM] : find(name)),
    );
    expect(result.legendIds).toEqual(["panam", "v", "judy"]);
  });

  test("UVS import keeps the starting character behavior", () => {
    const uvsIndex = buildCardNameIndex([card("c1", "Ryu"), card("f1", "Hadoken")]);
    const parsed = parseUvsUltraDeck("[b]Character[/b]\n1 Ryu\n\n[b]Foundation[/b]\n4 Hadoken");
    const imported = UVS_DECK_SETUP_HELPERS.importPatch(parsed, (name) => findCardsByName(name, uvsIndex));
    expect(imported.patch as unknown).toEqual({ game: "uvs", startingCharacterId: "c1" });
    expect(imported.unresolved).toEqual([]);
    const missing = parseUvsUltraDeck("[b]Character[/b]\n1 Ken");
    expect(UVS_DECK_SETUP_HELPERS.importPatch(missing, () => [])).toEqual({ patch: null, unresolved: ["Ken"] });
  });

  test("export passes setup cards in order (character = first)", () => {
    const params = setupExportCards(["v", "missing", "panam"], (id) => byId.get(id));
    expect(String(params.character?._id)).toBe("v");
    expect(params.setupCards.map((entry) => entry.name)).toEqual(["V", "Panam Palmer"]);
    const text = formatCyberpunkDeckText({ ...params, main: [{ name: "Pistol", quantity: 3, type: "Gear" }], side: [] });
    expect(text).toBe("Legends\n1 V\n1 Panam Palmer\n\nDeck\n3 Pistol");
    expect(setupExportCards([], () => undefined)).toEqual({ character: null, setupCards: [] });
  });
});

describe("RAM budget summary", () => {
  test("budget per color, over-budget copies, colorless", () => {
    const summary = buildRamBudgetSummary(
      [V, JOHNNY, PANAM],
      [
        { card: MANTIS, quantity: 3 }, // red 3 <= 3
        { card: PISTOL, quantity: 2 }, // red 1
        { card: HACK, quantity: 2 }, // blue: no blue Legend -> over
        { card: DRONE, quantity: 1 }, // colorless
      ],
    );
    expect(summary.rows).toEqual([
      { color: "red", label: "Red", swatch: "350 90% 55%", budget: 3, cardCount: 5, maxRam: 3, overBudgetCount: 0 },
      { color: "green", label: "Green", swatch: "142 70% 45%", budget: 3, cardCount: 0, maxRam: 0, overBudgetCount: 0 },
      { color: "blue", label: "Blue", swatch: "210 90% 56%", budget: 0, cardCount: 2, maxRam: 1, overBudgetCount: 2 },
    ]);
    expect(summary.overBudgetCount).toBe(2);
    expect(summary.colorlessCount).toBe(1);
  });

  test("RAM above the budget is over; duplicate-name Legends don't add RAM", () => {
    const summary = buildRamBudgetSummary([V, V2, legend("v3", "V", "red", 5)], [{ card: MANTIS, quantity: 2 }]);
    expect(summary.rows.find((row) => row.color === "red")).toMatchObject({ budget: 2, overBudgetCount: 2 });
    expect(summary.rows.find((row) => row.color === "blue")).toBeUndefined();
  });
});

describe("deck stats charts", () => {
  const formatCardType = (type?: string) => type;

  test("Cyberpunk: cost curve fills gaps, colors in official order, types", () => {
    const entries = [
      { card: PISTOL, quantity: 3 },
      { card: HACK, quantity: 2 },
      { card: DRONE, quantity: 1 },
    ];
    const [cost, colors, types] = buildDeckStatsChartData(CYBERPUNK_DECK_STATS_CHARTS, entries, formatCardType);
    expect(cost.buckets).toEqual([
      { label: "0", value: 0 },
      { label: "1", value: 3 },
      { label: "2", value: 0 },
      { label: "3", value: 2 },
      { label: "4", value: 1 },
    ]);
    expect(colors.buckets).toEqual([
      { label: "Red", value: 3 },
      { label: "Blue", value: 2 },
      { label: "Colorless", value: 1 },
    ]);
    expect(types.buckets).toEqual([
      { label: "Gear", value: 3 },
      { label: "Program", value: 2 },
      { label: "Unit", value: 1 },
    ]);
  });

  test("curve puts missing values last", () => {
    expect(buildCurveDistribution([{ card: DRONE, quantity: 2 }, { card: V, quantity: 1 }], (entry) => entry.cost)).toEqual([
      { label: "0", value: 0 },
      { label: "1", value: 0 },
      { label: "2", value: 0 },
      { label: "3", value: 0 },
      { label: "4", value: 2 },
      { label: "None", value: 1 },
    ]);
  });

  test("UVS charts keep the previous titles, order and attack-only totals", () => {
    const attack = card("a", "Punch", { type: "Attack", difficulty: 2, control: 5, speed: 3, damage: 4, attackZone: "High" });
    const foundation = card("f", "Stance", { type: "Foundation", difficulty: 1, control: 4, blockZone: "Mid" });
    const data = buildDeckStatsChartData(
      UVS_DECK_STATS_CHARTS,
      [
        { card: attack, quantity: 2 },
        { card: foundation, quantity: 3 },
      ],
      formatCardType,
    );
    expect(data.map((entry) => entry.chart.title)).toEqual([
      "Card Type Ratios",
      "Difficulty",
      "Check Value",
      "Block Mods",
      "Block Zones",
      "Attack Zones",
      "Attack Speed",
      "Attack Damage",
    ]);
    expect(data.map((entry) => entry.total)).toEqual([5, 5, 5, 5, 5, 2, 2, 2]);
    expect(data[1].buckets).toEqual([
      { label: "1", value: 3 },
      { label: "2", value: 2 },
    ]);
    expect(data[4].buckets).toEqual([
      { label: "None", value: 2 },
      { label: "Mid", value: 3 },
    ].sort((a, b) => b.value - a.value));
  });
});

describe("module-driven deck list + targets", () => {
  test("active deck groups follow the Cyberpunk type order and labels", () => {
    const deck = getSharedGameModule("cyberpunk").deck;
    const groups = buildSectionGroups(
      { hack: 2, drone: 1, pistol: 3 },
      new Map([PISTOL, HACK, DRONE].map((entry) => [entry._id as string, entry])),
      (type) => type,
      deck.cardTypeOrder,
      deck.cardTypeLabels,
    );
    expect(groups.map((group) => [group.label, group.total])).toEqual([
      ["Units", 1],
      ["Gear", 3],
      ["Programs", 2],
    ]);
  });

  test("main deck target comes from the default format", () => {
    expect(mainDeckTarget(getSharedGameModule("uvs"))).toBe(60);
    expect(mainDeckTarget(getSharedGameModule("cyberpunk"))).toBe(40);
  });
});
