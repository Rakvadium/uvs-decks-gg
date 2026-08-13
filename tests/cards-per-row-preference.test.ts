import { describe, expect, test } from "bun:test";
import {
  clampGalleryCardsPerRow,
  parseStoredCardsPerRow,
  resolveGalleryCardsPerRowPreference,
} from "../src/lib/gallery/cards-per-row-preference";

describe("resolveGalleryCardsPerRowPreference", () => {
  test("prefers single over dual legacy keys", () => {
    expect(
      resolveGalleryCardsPerRowPreference({
        single: 7,
        open: 4,
        closed: 6,
      })
    ).toBe(7);
  });

  test("falls back to closed then open", () => {
    expect(resolveGalleryCardsPerRowPreference({ closed: 6, open: 4 })).toBe(6);
    expect(resolveGalleryCardsPerRowPreference({ open: 4 })).toBe(4);
    expect(resolveGalleryCardsPerRowPreference({})).toBeUndefined();
  });
});

describe("parseStoredCardsPerRow", () => {
  test("parses integers and rejects empty/invalid", () => {
    expect(parseStoredCardsPerRow("8")).toBe(8);
    expect(parseStoredCardsPerRow(null)).toBeUndefined();
    expect(parseStoredCardsPerRow("")).toBeUndefined();
    expect(parseStoredCardsPerRow("nope")).toBeUndefined();
  });
});

describe("clampGalleryCardsPerRow", () => {
  test("clamps and falls back", () => {
    expect(clampGalleryCardsPerRow(8, 6, 3, 10)).toBe(8);
    expect(clampGalleryCardsPerRow(1, 6, 3, 10)).toBe(3);
    expect(clampGalleryCardsPerRow(12, 6, 3, 10)).toBe(10);
    expect(clampGalleryCardsPerRow(undefined, 6, 3, 10)).toBe(6);
  });
});
