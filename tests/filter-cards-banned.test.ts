import { describe, expect, test } from "bun:test";
import { UVS_FILTER_DEFINITION } from "../shared/games/uvs/filters";
import { filterCards } from "../src/lib/universus/use-universus-cards";
import type { CachedCard } from "../src/lib/universus/card-store";
import type { Id } from "../convex/_generated/dataModel";

function card(id: string, name: string): CachedCard {
  return {
    _id: id as Id<"cards">,
    _creationTime: 0,
    name,
    isFrontFace: true,
    isVariant: false,
    setCode: "test-set",
  };
}

describe("filterCards format bans", () => {
  const legal = card("legal1", "Legal Card");
  const banned = card("banned1", "Banned Card");
  const cards = [legal, banned];
  const isCardBannedInFormat = (cardId: string) => cardId === banned._id;

  test("hides banned cards for a format by default", () => {
    const filtered = filterCards(cards, { format: "standard" }, { isCardBannedInFormat }, UVS_FILTER_DEFINITION);
    expect(filtered.map((entry) => entry._id)).toEqual([legal._id]);
  });

  test("includes banned cards when includeBanned is true", () => {
    const filtered = filterCards(
      cards,
      { format: "standard", includeBanned: true },
      { isCardBannedInFormat },
      UVS_FILTER_DEFINITION
    );
    expect(filtered.map((entry) => entry._id)).toEqual([legal._id, banned._id]);
  });
});
