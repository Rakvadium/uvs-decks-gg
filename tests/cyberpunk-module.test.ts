import { describe, expect, test } from "bun:test";
import { getSharedGameModule } from "@shared/games/registry";
import { getFilterGroupLayout } from "@shared/games/filters";
import {
  deckSetupCardIdsForAnyGame,
  deckSetupPreviewCardId,
  resolveDeckSetupPatchArgs,
} from "@shared/games/deck-setup";
import {
  applyCyberpunkSetupPatch,
  cyberpunkSetupCardIds,
  normalizeCyberpunkSetup,
} from "@shared/games/cyberpunk/setup";
import { formatCyberpunkDeckText, parseCyberpunkDeckText } from "@shared/games/cyberpunk/deck-text";
import { canAddCyberpunkCardToDeck, getCyberpunkCardCopyLimit } from "@shared/games/cyberpunk/card-eligibility";
import { CYBERPUNK_FILTER_DEFINITION } from "@shared/games/cyberpunk/filters";
import { UVS_FILTER_DEFINITION } from "@shared/games/uvs/filters";
import { normalizeDeckSetup, applyDeckSetupPatch, deckSetupCardIds } from "@shared/games/uvs/setup";

const cp = getSharedGameModule("cyberpunk");
const uvs = getSharedGameModule("uvs");

describe("cyberpunk module identity", () => {
  test("id, names, theme, brand", () => {
    expect(cp.id).toBe("cyberpunk");
    expect(cp.displayName).toBe("Cyberpunk TCG");
    expect(cp.shortName).toBe("CPK");
    expect(cp.theme).toEqual({ primary: "55 98% 51%", secondary: "184 100% 50%", accent: "350 90% 55%" });
    expect(cp.brand.wordmark).toEqual(["TCG", "DECKS", ".GG"]);
    expect(cp.brand.title).toBe("Cyberpunk TCG · TCGDECKS.GG");
    expect(cp.deck.sideboardLimit).toBe(0);
    expect([...cp.deck.cardTypeOrder]).toEqual(["Unit", "Gear", "Program"]);
    expect(cp.deck.cardTypeLabels.Program).toBe("Programs");
    expect(cp.deck.extractZones("High")).toEqual([]);
    expect(cp.deck.zoneTone("High")).toBeNull();
  });

  test("standard format seed", () => {
    expect(cp.defaultFormats).toEqual([
      expect.objectContaining({
        key: "standard",
        isDefault: true,
        minDeckSize: 40,
        maxDeckSize: 50,
        defaultCopyLimit: 3,
        sideboardRule: "max:0",
        requiresStartingCharacter: false,
        requiresIdentity: false,
      }),
    ]);
    expect(uvs.defaultFormats.map((f) => f.key)).toEqual(["standard", "heroic", "retro"]);
  });

  test("simulator hand size is 6 regardless of setup", () => {
    expect(cp.deck.simulatorHandSize({ game: "cyberpunk", legendIds: [] }, () => null)).toBe(6);
  });
});

describe("cyberpunk setup", () => {
  test("normalize: fresh copy; foreign setup and legacy UVS fields are ignored", () => {
    const setup = { game: "cyberpunk" as const, legendIds: ["a", "b"] };
    const out = normalizeCyberpunkSetup({ setup });
    expect(out).toEqual(setup);
    expect(out.legendIds).not.toBe(setup.legendIds);
    expect(normalizeCyberpunkSetup(null)).toEqual({ game: "cyberpunk", legendIds: [] });
    expect(normalizeCyberpunkSetup({ startingCharacterId: "c" })).toEqual({ game: "cyberpunk", legendIds: [] });
    expect(normalizeCyberpunkSetup({ setup: { game: "uvs", startingCharacterId: "c" } })).toEqual({
      game: "cyberpunk",
      legendIds: [],
    });
    expect(cp.deck.normalizeSetup({ setup })).toEqual(setup);
  });

  test("patch: undefined keeps, null clears, array replaces", () => {
    const current = { game: "cyberpunk" as const, legendIds: ["a"] };
    expect(applyCyberpunkSetupPatch(current, undefined)).toEqual(current);
    expect(applyCyberpunkSetupPatch(current, null)).toEqual({ game: "cyberpunk", legendIds: [] });
    expect(applyCyberpunkSetupPatch(current, { game: "cyberpunk" })).toEqual(current);
    expect(applyCyberpunkSetupPatch(current, { game: "cyberpunk", legendIds: null })).toEqual({
      game: "cyberpunk",
      legendIds: [],
    });
    expect(applyCyberpunkSetupPatch(current, { game: "cyberpunk", legendIds: ["x", "y", "z"] })).toEqual({
      game: "cyberpunk",
      legendIds: ["x", "y", "z"],
    });
    expect(current).toEqual({ game: "cyberpunk", legendIds: ["a"] });
  });

  test("patch rejects other games, >3 legends and duplicate ids", () => {
    const current = { game: "cyberpunk" as const, legendIds: [] };
    expect(() => applyCyberpunkSetupPatch(current, { game: "uvs", startingCharacterId: "c" })).toThrow(/uvs/);
    expect(() => applyCyberpunkSetupPatch(current, { game: "cyberpunk", legendIds: ["a", "b", "c", "d"] })).toThrow(
      /at most 3/,
    );
    expect(() => applyCyberpunkSetupPatch(current, { game: "cyberpunk", legendIds: ["a", "a"] })).toThrow(/twice/);
  });

  test("setupCardIds / setupPreviewCardId", () => {
    expect(cyberpunkSetupCardIds({ game: "cyberpunk", legendIds: ["a", "b"] })).toEqual(["a", "b"]);
    expect(cyberpunkSetupCardIds({ game: "cyberpunk", legendIds: null })).toEqual([]);
    expect(cyberpunkSetupCardIds({ game: "cyberpunk" })).toEqual([]);
    expect(cyberpunkSetupCardIds({ game: "uvs", startingCharacterId: "c" })).toEqual([]);
    expect(cyberpunkSetupCardIds(null)).toEqual([]);
    expect(cp.deck.setupPreviewCardId({ game: "cyberpunk", legendIds: ["a", "b"] })).toBe("a");
    expect(cp.deck.setupPreviewCardId({ game: "cyberpunk", legendIds: [] })).toBeUndefined();
    expect(cp.deck.setupPreviewCardId({ game: "uvs", startingCharacterId: "c" })).toBeUndefined();
    expect(uvs.deck.setupPreviewCardId({ game: "uvs", startingCharacterId: "c" })).toBe("c");
    expect(uvs.deck.setupPreviewCardId({ game: "cyberpunk", legendIds: ["a"] })).toBeUndefined();
    expect(uvs.deck.setupPreviewCardId(null)).toBeUndefined();
  });

  test("UVS setup functions ignore / reject a Cyberpunk setup", () => {
    const cpSetup = { game: "cyberpunk" as const, legendIds: ["a"] };
    expect(normalizeDeckSetup({ setup: cpSetup, startingCharacterId: "legacy" })).toEqual({ game: "uvs" });
    expect(deckSetupCardIds(cpSetup)).toEqual([]);
    expect(applyDeckSetupPatch(cpSetup, undefined)).toEqual({ game: "uvs" });
    expect(() => applyDeckSetupPatch({ game: "uvs" }, { game: "cyberpunk", legendIds: [] })).toThrow(/cyberpunk/);
    expect(uvs.deck.simulatorHandSize(cpSetup, () => ({ handSize: 7 }))).toBe(0);
  });

  test("dispatch helpers pick the module from setup.game", () => {
    expect(deckSetupPreviewCardId({ game: "cyberpunk", legendIds: ["l1", "l2"] })).toBe("l1");
    expect(deckSetupPreviewCardId({ game: "uvs", startingCharacterId: "c" })).toBe("c");
    expect(deckSetupPreviewCardId(undefined)).toBeUndefined();
    expect(deckSetupCardIdsForAnyGame({ game: "cyberpunk", legendIds: ["l1"] })).toEqual(["l1"]);
    expect(deckSetupCardIdsForAnyGame({ game: "uvs", startingCharacterId: null })).toEqual([]);
  });
});

describe("resolveDeckSetupPatchArgs", () => {
  const none = {};

  test("rejects a setup for another game", () => {
    expect(() => resolveDeckSetupPatchArgs("uvs", { game: "cyberpunk", legendIds: [] }, none)).toThrow(
      'Deck setup is for "cyberpunk" but the deck is a "uvs" deck',
    );
    expect(() => resolveDeckSetupPatchArgs("cyberpunk", { game: "uvs" }, none)).toThrow(/"uvs"/);
  });

  test("UVS folds legacy args (unchanged behavior)", () => {
    expect(resolveDeckSetupPatchArgs("uvs", undefined, none)).toBeUndefined();
    expect(resolveDeckSetupPatchArgs("uvs", null, none)).toBeNull();
    expect(resolveDeckSetupPatchArgs("uvs", undefined, { startingCharacterId: "c" })).toEqual({
      game: "uvs",
      startingCharacterId: "c",
      selectedIdentity: undefined,
    });
  });

  test("Cyberpunk passes the patch through and rejects legacy args", () => {
    const patch = { game: "cyberpunk" as const, legendIds: ["a"] };
    expect(resolveDeckSetupPatchArgs("cyberpunk", patch, none)).toBe(patch);
    expect(resolveDeckSetupPatchArgs("cyberpunk", null, none)).toBeNull();
    expect(resolveDeckSetupPatchArgs("cyberpunk", undefined, none)).toBeUndefined();
    expect(() => resolveDeckSetupPatchArgs("cyberpunk", undefined, { startingCharacterId: "c" })).toThrow(
      /UniVersus-only/,
    );
    expect(() => resolveDeckSetupPatchArgs("cyberpunk", patch, { selectedIdentity: null })).toThrow(/UniVersus-only/);
  });
});

describe("cyberpunk card eligibility", () => {
  test("any typed non-Legend card; missing card allowed", () => {
    expect(canAddCyberpunkCardToDeck({ type: "Unit" })).toBe(true);
    expect(canAddCyberpunkCardToDeck({ type: "Something New" })).toBe(true);
    expect(canAddCyberpunkCardToDeck({ type: "Legend" })).toBe(false);
    expect(canAddCyberpunkCardToDeck({ type: " legend " })).toBe(false);
    expect(canAddCyberpunkCardToDeck({})).toBe(false);
    expect(canAddCyberpunkCardToDeck({ type: "  " })).toBe(false);
    expect(canAddCyberpunkCardToDeck(null)).toBe(true);
  });

  test("copy limit: default 3, positive override, unlimited", () => {
    expect(getCyberpunkCardCopyLimit({})).toBe(3);
    expect(getCyberpunkCardCopyLimit({ copyLimit: 5 })).toBe(5);
    expect(getCyberpunkCardCopyLimit({ copyLimit: 1 })).toBe(1);
    expect(getCyberpunkCardCopyLimit({ copyLimit: null })).toBe(Number.POSITIVE_INFINITY);
    expect(getCyberpunkCardCopyLimit({ copyLimit: 0 })).toBe(Number.POSITIVE_INFINITY);
    expect(getCyberpunkCardCopyLimit(null)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("cyberpunk deck text", () => {
  const legends = [{ name: "V, Streetkid" }, { name: "Johnny" }, { name: "Panam" }];
  const main = [
    { name: "Zeta Program", quantity: 2, type: "Program" },
    { name: "Mantis Blades", quantity: 3, type: "Gear" },
    { name: "Beta Unit", quantity: 3, type: "Unit" },
    { name: "Alpha Unit", quantity: 1, type: "Unit" },
    { name: "Mystery", quantity: 1 },
  ];

  test("format: Legends in setup order, then Deck by type order then name", () => {
    expect(formatCyberpunkDeckText({ character: null, setupCards: legends, main, side: [] })).toBe(
      [
        "Legends",
        "1 V, Streetkid",
        "1 Johnny",
        "1 Panam",
        "",
        "Deck",
        "1 Alpha Unit",
        "3 Beta Unit",
        "3 Mantis Blades",
        "2 Zeta Program",
        "1 Mystery",
      ].join("\n"),
    );
    expect(formatCyberpunkDeckText({ character: null, main: [], side: [] })).toBe("Legends\n\nDeck");
    expect(
      formatCyberpunkDeckText({ character: null, main: [], side: [{ name: "S", quantity: 1 }] }),
    ).toBe("Legends\n\nDeck\n\nSideboard\n1 S");
  });

  test("round trip", () => {
    const text = formatCyberpunkDeckText({ character: null, setupCards: legends, main, side: [] });
    const parsed = parseCyberpunkDeckText(text);
    expect(parsed.character).toBeNull();
    expect(parsed.setupCards).toEqual(legends.map((l) => ({ name: l.name, quantity: 1 })));
    expect(parsed.main.map((l) => `${l.quantity} ${l.name}`).sort()).toEqual(
      main.map((l) => `${l.quantity} ${l.name}`).sort(),
    );
    expect(parsed.side).toEqual([]);
    expect(cp.deck.text.parse(text)).toEqual(parsed);
  });

  test("lenient parse: quantity forms, headings, unknown lines", () => {
    const text = [
      "Top card before any heading",
      "2 Loose Card",
      "# Legends (3):",
      "1x V, Streetkid",
      "Johnny x1",
      "[b]Deck[/b]",
      "3x Mantis Blades",
      "Kiroshi Optics x 2",
      "3 X-Ray Scan",
      "Units:",
      "4 Under Unknown Heading",
      "0 Zero Copies",
      "",
      "Main Deck",
      "1 After Main",
      "Side",
      "1 Side Card",
    ].join("\r\n");
    expect(parseCyberpunkDeckText(text)).toEqual({
      character: null,
      setupCards: [
        { name: "V, Streetkid", quantity: 1 },
        { name: "Johnny", quantity: 1 },
      ],
      main: [
        { name: "Loose Card", quantity: 2 },
        { name: "Mantis Blades", quantity: 3 },
        { name: "Kiroshi Optics", quantity: 2 },
        { name: "X-Ray Scan", quantity: 3 },
        { name: "Under Unknown Heading", quantity: 4 },
        { name: "After Main", quantity: 1 },
      ],
      side: [{ name: "Side Card", quantity: 1 }],
    });
  });
});

describe("filter definitions", () => {
  test("cyberpunk: cost/power/ram stats, color + tag facets, no UVS facets", () => {
    const def = CYBERPUNK_FILTER_DEFINITION;
    expect(cp.filters).toBe(def);
    expect(def.stats.map((s) => [s.key, s.cardField])).toEqual([
      ["cost", "cost"],
      ["power", "power"],
      ["ram", "ram"],
    ]);
    expect(def.stats.every((s) => s.applyRange && s.sortable)).toBe(true);
    expect(def.zones).toEqual([]);
    expect(getFilterGroupLayout(def).map((g) => g.stats.map((s) => s.key))).toEqual([["cost", "power", "ram"]]);
    expect(def.facets).toMatchObject({ symbols: false, zones: false, keywords: false, uvsCardFlags: false, tags: true });
    expect(def.facets.colors?.map((c) => c.value)).toEqual(["red", "green", "blue", "yellow"]);
  });

  test("UVS facets describe today's gallery", () => {
    expect(UVS_FILTER_DEFINITION.facets).toEqual({
      symbols: true,
      zones: true,
      keywords: true,
      uvsCardFlags: true,
      tags: false,
    });
  });
});
