import { describe, expect, test } from "bun:test";
import {
  applyDeckSetupPatch,
  deckSetupCardIds,
  deckSetupMigrationPatch,
  mergeLegacyDeckSetupArgs,
  normalizeDeckSetup,
} from "@shared/games/uvs/setup";
import { getSharedGameModule } from "@shared/games/registry";

describe("normalizeDeckSetup", () => {
  test("missing deck / no fields yields an empty uvs setup", () => {
    expect(normalizeDeckSetup(null)).toEqual({ game: "uvs" });
    expect(normalizeDeckSetup(undefined)).toEqual({ game: "uvs" });
    expect(normalizeDeckSetup({})).toEqual({ game: "uvs" });
  });

  test("falls back to legacy fields, keeping empty-string identity and dropping nulls", () => {
    expect(normalizeDeckSetup({ startingCharacterId: "c1", selectedIdentity: "fire" })).toEqual({
      game: "uvs",
      startingCharacterId: "c1",
      selectedIdentity: "fire",
    });
    expect(normalizeDeckSetup({ selectedIdentity: "" })).toEqual({ game: "uvs", selectedIdentity: "" });
    expect(normalizeDeckSetup({ startingCharacterId: null, selectedIdentity: null })).toEqual({ game: "uvs" });
  });

  test("prefers setup as a whole over legacy fields", () => {
    const deck = {
      setup: { game: "uvs" as const, selectedIdentity: "water" },
      startingCharacterId: "stale",
      selectedIdentity: "fire",
    };
    expect(normalizeDeckSetup(deck)).toEqual({ game: "uvs", selectedIdentity: "water" });
  });

  test("returns a fresh object", () => {
    const setup = { game: "uvs" as const, startingCharacterId: "c1" };
    const out = normalizeDeckSetup({ setup });
    expect(out).toEqual(setup);
    expect(out).not.toBe(setup);
  });
});

describe("applyDeckSetupPatch", () => {
  const current = { game: "uvs" as const, startingCharacterId: "c1", selectedIdentity: "fire" };

  test("undefined patch keeps; null patch clears everything", () => {
    expect(applyDeckSetupPatch(current, undefined)).toEqual(current);
    expect(applyDeckSetupPatch(current, null)).toEqual({ game: "uvs" });
  });

  test("per field: omitted keeps, null clears, value sets (including empty string)", () => {
    expect(applyDeckSetupPatch(current, { game: "uvs" })).toEqual(current);
    expect(applyDeckSetupPatch(current, { game: "uvs", startingCharacterId: null })).toEqual({
      game: "uvs",
      selectedIdentity: "fire",
    });
    expect(applyDeckSetupPatch(current, { game: "uvs", selectedIdentity: "" })).toEqual({
      ...current,
      selectedIdentity: "",
    });
    expect(applyDeckSetupPatch(current, { game: "uvs", startingCharacterId: "c2", selectedIdentity: null })).toEqual({
      game: "uvs",
      startingCharacterId: "c2",
    });
  });

  test("does not mutate the current setup", () => {
    const copy = { ...current };
    applyDeckSetupPatch(copy, { game: "uvs", startingCharacterId: null });
    expect(copy).toEqual(current);
  });
});

describe("mergeLegacyDeckSetupArgs", () => {
  test("no legacy args passes setup through (undefined = no write)", () => {
    expect(mergeLegacyDeckSetupArgs(undefined, {})).toBeUndefined();
    expect(mergeLegacyDeckSetupArgs(null, {})).toBeNull();
    const patch = { game: "uvs" as const, selectedIdentity: "fire" };
    expect(mergeLegacyDeckSetupArgs(patch, {})).toBe(patch);
  });

  test("legacy args become a patch; explicit setup fields win", () => {
    expect(mergeLegacyDeckSetupArgs(undefined, { startingCharacterId: null })).toEqual({
      game: "uvs",
      startingCharacterId: null,
      selectedIdentity: undefined,
    });
    expect(
      mergeLegacyDeckSetupArgs({ game: "uvs", selectedIdentity: "water" }, { selectedIdentity: "air", startingCharacterId: "c1" }),
    ).toEqual({ game: "uvs", selectedIdentity: "water", startingCharacterId: "c1" });
  });

  test("setup: null clears fields not set by a legacy arg", () => {
    expect(mergeLegacyDeckSetupArgs(null, { selectedIdentity: "air" })).toEqual({
      game: "uvs",
      startingCharacterId: null,
      selectedIdentity: "air",
    });
  });
});

describe("deckSetupCardIds", () => {
  test("returns the starting character when set", () => {
    expect(deckSetupCardIds({ game: "uvs", startingCharacterId: "c1" })).toEqual(["c1"]);
    expect(deckSetupCardIds({ game: "uvs", startingCharacterId: null })).toEqual([]);
    expect(deckSetupCardIds(null)).toEqual([]);
  });
});

describe("deckSetupMigrationPatch", () => {
  test("moves legacy fields into setup and unsets them", () => {
    const patch = deckSetupMigrationPatch({ startingCharacterId: "c1", selectedIdentity: "fire" });
    expect(patch).toEqual({
      setup: { game: "uvs", startingCharacterId: "c1", selectedIdentity: "fire" },
      startingCharacterId: undefined,
      selectedIdentity: undefined,
    });
    expect(Object.keys(patch!).sort()).toEqual(["selectedIdentity", "setup", "startingCharacterId"]);
  });

  test("decks with neither shape get an empty setup", () => {
    expect(deckSetupMigrationPatch({})?.setup).toEqual({ game: "uvs" });
  });

  test("already-migrated decks are skipped (idempotent)", () => {
    expect(deckSetupMigrationPatch({ setup: { game: "uvs", selectedIdentity: "fire" } })).toBeNull();
    const once = deckSetupMigrationPatch({ selectedIdentity: "fire" })!;
    expect(deckSetupMigrationPatch({ setup: once.setup })).toBeNull();
  });

  test("non-UVS decks are skipped; missing game means UVS", () => {
    expect(deckSetupMigrationPatch({ game: "other", selectedIdentity: "fire" })).toBeNull();
    expect(deckSetupMigrationPatch({ game: "uvs", selectedIdentity: "fire" })?.setup).toEqual({
      game: "uvs",
      selectedIdentity: "fire",
    });
    expect(deckSetupMigrationPatch({ game: null, selectedIdentity: "fire" })).not.toBeNull();
  });

  test("setup plus leftover legacy fields: keeps setup, clears legacy", () => {
    expect(
      deckSetupMigrationPatch({ setup: { game: "uvs", selectedIdentity: "water" }, selectedIdentity: "fire" }),
    ).toEqual({ setup: { game: "uvs", selectedIdentity: "water" }, startingCharacterId: undefined, selectedIdentity: undefined });
  });
});

describe("UVS game module deck API", () => {
  const deck = getSharedGameModule("uvs").deck;

  test("exposes setup helpers and UVS constants", () => {
    expect(deck.normalizeSetup({ selectedIdentity: "fire" })).toEqual({ game: "uvs", selectedIdentity: "fire" });
    expect(deck.applySetupPatch({ game: "uvs" }, { game: "uvs", startingCharacterId: "c1" })).toEqual({
      game: "uvs",
      startingCharacterId: "c1",
    });
    expect([...deck.cardTypeOrder]).toEqual(["Attack", "Foundation", "Action", "Asset", "Backup", "Character"]);
    expect(deck.cardTypeLabels.Attack).toBe("Attacks");
    expect(deck.sideboardLimit).toBe(10);
    expect([...deck.text.mainTypeOrder]).toEqual(["Foundation", "Attack", "Asset", "Action", "Backup"]);
    expect(deck.isMainDeckEligible({ difficulty: 1, control: 2 })).toBe(true);
    expect(deck.isMainDeckEligible({ difficulty: 1 })).toBe(false);
    expect(deck.getCardCopyLimit({ copyLimit: 1 })).toBe(1);
    expect(deck.extractZones("High/Mid")).toEqual(["High", "Mid"]);
    expect(deck.zoneTone("low")).toBe("low");
  });

  test("simulator hand size comes from the starting character", () => {
    const cards = new Map([["c1", { handSize: 7 }], ["c2", {}]]);
    const get = (id: string) => cards.get(id);
    expect(deck.simulatorHandSize({ game: "uvs", startingCharacterId: "c1" }, get)).toBe(7);
    expect(deck.simulatorHandSize({ game: "uvs", startingCharacterId: "c2" }, get)).toBe(0);
    expect(deck.simulatorHandSize({ game: "uvs", startingCharacterId: "missing" }, get)).toBe(0);
    expect(deck.simulatorHandSize({ game: "uvs" }, get)).toBe(0);
  });

  test("validation plan: standard loads positive quantity keys + starter; others load card id lists", () => {
    const base = {
      mainCardIds: ["a", "b", "z"],
      mainQuantities: { a: 2, b: 0, c: 1 },
      sideCardIds: ["s"],
      sideQuantities: { a: 1, s: 1 },
      setup: { game: "uvs" as const, startingCharacterId: "c" },
    };
    const format = {
      key: "standard",
      minDeckSize: 1,
      sideboardRule: "none",
      defaultCopyLimit: 4,
      requiresStartingCharacter: true,
      requiresIdentity: true,
    };
    expect(deck.validation.plan(base, format)).toEqual({ cardIds: ["a", "c", "s"], setupCardIds: ["c"] });
    expect(deck.validation.plan(base, { ...format, key: "legacy" })).toEqual({
      cardIds: ["a", "b", "z", "s"],
      setupCardIds: [],
    });
  });

  test("validation reads setup (new shape) the same as legacy fields", () => {
    const format = {
      key: "standard",
      minDeckSize: 0,
      sideboardRule: "none",
      defaultCopyLimit: 4,
      requiresStartingCharacter: true,
      requiresIdentity: true,
    };
    const run = (setupFields: object) =>
      deck.validation.validate({
        deck: { mainCardIds: [], mainQuantities: {}, sideCardIds: [], sideQuantities: {}, ...setupFields },
        format,
        cards: new Map(),
        setupCards: new Map([["c1", { _id: "c1", name: "Hero", type: "Character" }]]),
        legality: [],
        now: 0,
      });
    const legacy = run({ startingCharacterId: "c1", selectedIdentity: "fire" });
    const modern = run({ setup: { game: "uvs", startingCharacterId: "c1", selectedIdentity: "fire" } });
    expect(legacy).toEqual({ errors: [], warnings: [] });
    expect(modern).toEqual(legacy);
    expect(run({ setup: { game: "uvs" }, startingCharacterId: "c1" }).errors.map((e) => e.code)).toEqual([
      "NO_STARTING_CHARACTER",
      "NO_IDENTITY",
    ]);
  });
});
