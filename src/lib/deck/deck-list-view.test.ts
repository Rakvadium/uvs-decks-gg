import { describe, expect, test } from "bun:test";
import { applyDeckListView, deckFormatOptions, formatDeckFormatLabel } from "./deck-list-view";

type Entry = { name: string; format?: string; _creationTime: number; mainQuantities: Record<string, number> };

const decks: Entry[] = [
  { name: "Bravo", format: "standard", _creationTime: 2, mainQuantities: { a: 2 } },
  { name: "alpha", format: "retro", _creationTime: 3, mainQuantities: { a: 4, b: 4 } },
  { name: "Charlie", _creationTime: 1, mainQuantities: {} },
];

describe("applyDeckListView", () => {
  test("default keeps server order and returns every deck", () => {
    expect(applyDeckListView(decks, "default", null).map((d) => d.name)).toEqual(["Bravo", "alpha", "Charlie"]);
  });

  test("sorts by each option", () => {
    expect(applyDeckListView(decks, "newest", null).map((d) => d.name)).toEqual(["alpha", "Bravo", "Charlie"]);
    expect(applyDeckListView(decks, "oldest", null).map((d) => d.name)).toEqual(["Charlie", "Bravo", "alpha"]);
    expect(applyDeckListView(decks, "name", null).map((d) => d.name)).toEqual(["alpha", "Bravo", "Charlie"]);
    expect(applyDeckListView(decks, "cards", null).map((d) => d.name)).toEqual(["alpha", "Bravo", "Charlie"]);
  });

  test("filters by format before sorting, without mutating the input", () => {
    const input = [...decks];
    expect(applyDeckListView(input, "name", "standard").map((d) => d.name)).toEqual(["Bravo"]);
    expect(input.map((d) => d.name)).toEqual(["Bravo", "alpha", "Charlie"]);
  });
});

test("deckFormatOptions lists distinct formats, sorted", () => {
  expect(deckFormatOptions(decks)).toEqual(["retro", "standard"]);
});

test("formatDeckFormatLabel title-cases ids", () => {
  expect(formatDeckFormatLabel("retro_standard")).toBe("Retro Standard");
});
