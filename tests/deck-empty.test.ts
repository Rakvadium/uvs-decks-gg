import { describe, expect, test } from "bun:test";
import { isDeckQuantitiesEmpty, quantityTotal } from "../src/components/deck-details/deck-empty";

describe("quantityTotal", () => {
  test("sums defined quantities", () => {
    expect(quantityTotal({ a: 1, b: 2 })).toBe(3);
  });

  test("treats missing quantities as zero", () => {
    expect(quantityTotal(undefined)).toBe(0);
  });
});

describe("isDeckQuantitiesEmpty", () => {
  test("treats null and undefined as empty", () => {
    expect(isDeckQuantitiesEmpty(null)).toBe(true);
    expect(isDeckQuantitiesEmpty(undefined)).toBe(true);
  });

  test("is empty when all zones are zero", () => {
    expect(
      isDeckQuantitiesEmpty({
        mainQuantities: {},
        sideQuantities: {},
        referenceQuantities: {},
      }),
    ).toBe(true);
  });

  test("is not empty when any zone has cards", () => {
    expect(
      isDeckQuantitiesEmpty({
        mainQuantities: { c1: 2 },
        sideQuantities: {},
        referenceQuantities: {},
      }),
    ).toBe(false);
    expect(
      isDeckQuantitiesEmpty({
        mainQuantities: {},
        sideQuantities: { c2: 1 },
        referenceQuantities: {},
      }),
    ).toBe(false);
    expect(
      isDeckQuantitiesEmpty({
        mainQuantities: {},
        sideQuantities: {},
        referenceQuantities: { c3: 1 },
      }),
    ).toBe(false);
  });
});
