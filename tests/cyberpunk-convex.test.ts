import { describe, expect, test } from "bun:test";
import { runDeckValidation } from "../convex/lib/deckFormatRules";
import { buildDuplicatedDeckFields } from "../convex/lib/duplicateDeck";
import { deriveCardSearchFields, sanitizeCardImportInput } from "../convex/lib/cardCreate";
import {
  cardDraftEditableValidator,
  cardInputValidator,
  cardValidator,
  deckSetupPatchValidator,
  deckSetupValidator,
} from "../convex/validators";
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { QueryCtx } from "../convex/_generated/server";
import { CYBERPUNK_DEFAULT_FORMATS } from "@shared/games/cyberpunk/formats";

// Small in-test cards shaped like the official card records (no fixture data).
function makeCard(id: string, fields: Partial<Doc<"cards">>): Doc<"cards"> {
  return {
    _id: id as Id<"cards">,
    _creationTime: 0,
    name: id,
    game: "cyberpunk",
    setCode: "S1",
    isFrontFace: true,
    isVariant: false,
    ...fields,
  } as Doc<"cards">;
}

const legends = [
  makeCard("l1", { name: "Legend One", subname: "First", type: "Legend", color: "Red", ram: 2 }),
  makeCard("l2", { name: "Legend Two", type: "Legend", color: "red", ram: 1 }),
  makeCard("l3", { name: "Legend Three", type: "Legend", color: "blue", ram: 3 }),
];
const mainCards = Array.from({ length: 14 }, (_, i) =>
  makeCard(`c${i}`, {
    name: `Card ${i}`,
    type: ["Unit", "Gear", "Program"][i % 3],
    color: i % 2 === 0 ? "red" : "Blue",
    ram: (i % 3) + 1,
    cost: i % 5,
    tags: "Street|Netrunner",
    sellable: i % 2 === 0,
  }),
);

const format = {
  _id: "fmt" as Id<"formats">,
  _creationTime: 0,
  game: "cyberpunk",
  ...CYBERPUNK_DEFAULT_FORMATS[0],
} as Doc<"formats">;

function makeDeck(overrides: Partial<Doc<"decks">> = {}): Doc<"decks"> {
  const mainQuantities = Object.fromEntries(mainCards.map((c) => [c._id, 3]));
  return {
    _id: "deck" as Id<"decks">,
    _creationTime: 0,
    userId: "u" as Id<"users">,
    name: "Cyber",
    isPublic: false,
    game: "cyberpunk",
    format: "standard",
    setup: { game: "cyberpunk", legendIds: legends.map((l) => l._id) },
    mainCardIds: mainCards.map((c) => c._id),
    mainQuantities,
    sideCardIds: [],
    sideQuantities: {},
    referenceCardIds: [],
    referenceQuantities: {},
    ...overrides,
  } as Doc<"decks">;
}

function makeCtx(legality: Array<{ cardId: string; status: "banned" | "restricted" | "legal" }> = []): QueryCtx {
  const byId = new Map<string, unknown>([...legends, ...mainCards].map((c) => [c._id as string, c]));
  const rows = legality.map((row, i) => ({ _id: `leg${i}`, _creationTime: 0, formatKey: "standard", ...row }));
  const db = {
    get: async (id: string) => byId.get(id) ?? null,
    query: () => ({
      withIndex: (_index: string, build: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => {
        const eqs: Record<string, unknown> = {};
        const q = {
          eq: (field: string, value: unknown) => {
            eqs[field] = value;
            return q;
          },
        };
        build(q);
        return { collect: async () => (eqs.game === "cyberpunk" ? rows : []) };
      },
    }),
  };
  return { db } as unknown as QueryCtx;
}

describe("cyberpunk deck validation through the Convex loader", () => {
  test("a legal deck (3 legends, 42 cards) validates with zero errors", async () => {
    const out = await runDeckValidation(makeCtx(), makeDeck(), format);
    expect(out).toEqual({ errors: [], warnings: [] });
  });

  test("dispatches by deck.game and loads legality for the deck's game", async () => {
    const out = await runDeckValidation(makeCtx([{ cardId: "c0", status: "banned" }]), makeDeck(), format);
    expect(out.errors.map((e) => e.code)).toEqual(["BANNED_CARD"]);
  });

  test("legend count, RAM and legends-in-main errors surface", async () => {
    const deck = makeDeck({
      setup: { game: "cyberpunk", legendIds: ["l1", "l3"] as Id<"cards">[] },
      mainQuantities: { ...makeDeck().mainQuantities, l2: 1 },
    });
    const out = await runDeckValidation(makeCtx(), deck, format);
    // red budget = 2 (only l1): red cards with RAM 3 fail
    expect(new Set(out.errors.map((e) => e.code))).toEqual(
      new Set(["WRONG_LEGEND_COUNT", "LEGEND_IN_MAIN_DECK", "RAM_EXCEEDS_BUDGET"]),
    );
  });

  test("duplicating a Cyberpunk deck keeps its setup and game", () => {
    const fields = buildDuplicatedDeckFields(makeDeck());
    expect(fields.game).toBe("cyberpunk");
    expect(fields.setup as unknown).toEqual({ game: "cyberpunk", legendIds: ["l1", "l2", "l3"] });
  });
});

describe("card columns + validators", () => {
  const NEW_COLUMNS = ["color", "cost", "power", "ram", "sellable", "tags", "subname", "artist"];

  test("cards / input / draft validators accept the Cyberpunk columns", () => {
    for (const validator of [cardValidator, cardInputValidator, cardDraftEditableValidator]) {
      for (const key of NEW_COLUMNS) {
        const field = (validator.fields as Record<string, { isOptional: string } | undefined>)[key];
        expect(field?.isOptional).toBe("optional");
      }
    }
  });

  test("setup validators are unions over games", () => {
    expect(deckSetupValidator.kind).toBe("union");
    expect(deckSetupValidator.members.map((m) => m.fields.game.value)).toEqual(["uvs", "cyberpunk"]);
    expect(deckSetupPatchValidator.members.map((m) => m.fields.game.value)).toEqual(["uvs", "cyberpunk"]);
  });

  test("import sanitizer keeps the new columns", () => {
    expect(
      sanitizeCardImportInput({
        name: "Legend One",
        subname: "First",
        artist: "Someone",
        color: "red",
        cost: 2,
        power: 3,
        ram: 2,
        sellable: true,
        tags: "Street|Netrunner",
        bogus: 1,
      }),
    ).toEqual({
      name: "Legend One",
      subname: "First",
      artist: "Someone",
      color: "red",
      cost: 2,
      power: 3,
      ram: 2,
      sellable: true,
      tags: "Street|Netrunner",
    });
  });

  test("search fields: UVS strings unchanged; tags/subname/color added only when present", () => {
    const uvs = { name: "Ryu", keywords: "Fury", text: "Hit", setName: "Set", type: "Attack", rarity: "C" };
    expect(deriveCardSearchFields(uvs)).toEqual({
      searchName: "Ryu",
      searchText: "Ryu Fury Hit",
      searchAll: "Ryu Ryu Fury Hit Set Attack C",
    });
    expect(
      deriveCardSearchFields({ name: "V", subname: "Streetkid", tags: "Street| Merc", color: "red", text: "t" }),
    ).toEqual({
      searchName: "V",
      searchText: "V Streetkid  Street Merc t",
      searchAll: "V V Streetkid  Street Merc t    red",
    });
  });
});
