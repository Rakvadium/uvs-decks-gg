import { describe, expect, test } from "bun:test";
import { buildStackedCurve, type StackedCurveRange } from "./stacked-curve";

type Card = { type: string; difficulty?: number | null };
const curve = (entries: Array<[Card, number]>, range?: StackedCurveRange) =>
  buildStackedCurve(
    entries.map(([card, quantity]) => ({ card, quantity })),
    (card) => card.difficulty,
    (card) => card.type,
    range
  );

describe("buildStackedCurve", () => {
  test("splits each column by type, stacking the most common type first", () => {
    const result = curve([
      [{ type: "Attack", difficulty: 3 }, 2],
      [{ type: "Foundation", difficulty: 3 }, 3],
      [{ type: "Foundation", difficulty: 1 }, 4],
      [{ type: "Asset", difficulty: 3 }, 1],
    ]);
    expect(result.types).toEqual(["Foundation", "Attack", "Asset"]);
    expect(result.columns.map((column) => column.label)).toEqual(["0", "1", "2", "3"]);
    expect(result.columns[3]).toEqual({
      value: 3,
      label: "3",
      total: 6,
      segments: [
        { type: "Foundation", count: 3 },
        { type: "Attack", count: 2 },
        { type: "Asset", count: 1 },
      ],
    });
    expect(result.columns[2]).toEqual({ value: 2, label: "2", total: 0, segments: [] });
    expect(result.max).toBe(6);
  });

  test("starts at 0 and fills empty steps up to the highest value", () => {
    const result = curve([[{ type: "Action", difficulty: 2 }, 1]]);
    expect(result.columns.map((column) => column.total)).toEqual([0, 0, 1]);
  });

  test("range.min drops the columns below it (check values start at 1)", () => {
    const result = curve([[{ type: "Attack", difficulty: 3 }, 1]], { min: 1 });
    expect(result.columns.map((column) => column.label)).toEqual(["1", "2", "3"]);
  });

  test("range.max always reaches an open-ended last column that collects higher values", () => {
    const short = curve([[{ type: "Attack", difficulty: 2 }, 1]], { min: 0, max: 7 });
    expect(short.columns.map((column) => column.label)).toEqual(["0", "1", "2", "3", "4", "5", "6", "7+"]);

    const tall = curve(
      [
        [{ type: "Attack", difficulty: 7 }, 1],
        [{ type: "Asset", difficulty: 9 }, 2],
      ],
      { min: 0, max: 7 }
    );
    expect(tall.columns.at(-1)).toEqual({
      value: 7,
      label: "7+",
      total: 3,
      segments: [
        { type: "Asset", count: 2 },
        { type: "Attack", count: 1 },
      ],
    });
  });

  test("leaves out cards without a numeric value and returns nothing for an empty deck", () => {
    expect(curve([[{ type: "Character", difficulty: null }, 1]])).toEqual({ columns: [], types: [], max: 0 });
    expect(curve([], { min: 0, max: 7 })).toEqual({ columns: [], types: [], max: 0 });
  });
});
