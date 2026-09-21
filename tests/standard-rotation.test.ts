import { describe, expect, test } from "bun:test";
import {
  buildRotationSnapshot,
  hasRotatedOutOfStandard,
  isInAutomaticRotatingWindow,
  leavesAtNextRotation,
  nextRotationYear,
  printingYearLeavingAtNextRotation,
  resolvePrintingYear,
  showsFutureTag,
  showsRotatingTag,
  STANDARD_FORMAT_KEY,
  type RotationSetInput,
} from "../shared/standard-rotation";

const SEP_21_2026 = Date.UTC(2026, 8, 21, 15, 0, 0);
const JAN_1_2027 = Date.UTC(2027, 0, 1, 12, 0, 0);
const JUN_1_2027 = Date.UTC(2027, 5, 1, 12, 0, 0);

function booster(year: number, month: number, day: number): RotationSetInput {
  return {
    productKind: "booster",
    releasedAt: Date.UTC(year, month - 1, day),
    printingYear: year,
  };
}

function printing(year: number, productKind: "booster" | "other" = "other"): RotationSetInput {
  return {
    productKind,
    printingYear: year,
    releasedAt: Date.UTC(year, 5, 1),
  };
}

describe("standard rotation", () => {
  test("on 2026-09-21, before any 2027 booster, next rotation is 2024 printings", () => {
    const sets = [
      booster(2026, 3, 1),
      booster(2027, 6, 1),
      printing(2024),
      printing(2025),
      printing(2023),
    ];
    const snapshot = buildRotationSnapshot(sets, SEP_21_2026);

    expect(nextRotationYear(snapshot)).toBe(2027);
    expect(printingYearLeavingAtNextRotation(snapshot)).toBe(2024);
    expect(leavesAtNextRotation(printing(2024), snapshot)).toBe(true);
    expect(leavesAtNextRotation(printing(2025), snapshot)).toBe(false);
    expect(hasRotatedOutOfStandard(printing(2024), snapshot)).toBe(false);
    expect(isInAutomaticRotatingWindow(printing(2024), snapshot)).toBe(false);
    expect(
      showsRotatingTag({
        set: printing(2024),
        snapshot,
        formatKey: STANDARD_FORMAT_KEY,
        nextRotationFilter: true,
      })
    ).toBe(true);
    expect(
      showsRotatingTag({
        set: printing(2024),
        snapshot,
        formatKey: STANDARD_FORMAT_KEY,
        nextRotationFilter: false,
      })
    ).toBe(false);
    expect(
      showsRotatingTag({
        set: printing(2024),
        snapshot,
        formatKey: "heroic",
        nextRotationFilter: true,
      })
    ).toBe(false);
  });

  test("throughout 2027 until the first booster, 2024 printings show Rotating", () => {
    const sets = [booster(2026, 3, 1), booster(2027, 6, 1), printing(2024)];
    const snapshot = buildRotationSnapshot(sets, JAN_1_2027);

    expect(hasRotatedOutOfStandard(printing(2024), snapshot)).toBe(false);
    expect(isInAutomaticRotatingWindow(printing(2024), snapshot)).toBe(true);
    expect(nextRotationYear(snapshot)).toBe(2027);
    expect(
      showsRotatingTag({
        set: printing(2024),
        snapshot,
        formatKey: STANDARD_FORMAT_KEY,
        nextRotationFilter: false,
      })
    ).toBe(true);
  });

  test("a deck released in the rotation year does not start rotation", () => {
    const deck: RotationSetInput = {
      productKind: "other",
      releasedAt: Date.UTC(2027, 0, 15),
      printingYear: 2027,
    };
    const snapshot = buildRotationSnapshot([deck, printing(2024)], JAN_1_2027);
    expect(snapshot.firstReleasedBoosterAt.has(2027)).toBe(false);
    expect(hasRotatedOutOfStandard(printing(2024), snapshot)).toBe(false);
  });

  test("after the first 2027 booster, 2024 leaves Standard and next rotation is 2025", () => {
    const sets = [booster(2026, 3, 1), booster(2027, 3, 1), printing(2024), printing(2025)];
    const snapshot = buildRotationSnapshot(sets, JUN_1_2027);

    expect(hasRotatedOutOfStandard(printing(2024), snapshot)).toBe(true);
    expect(hasRotatedOutOfStandard(printing(2025), snapshot)).toBe(false);
    expect(isInAutomaticRotatingWindow(printing(2024), snapshot)).toBe(false);
    expect(nextRotationYear(snapshot)).toBe(2028);
    expect(printingYearLeavingAtNextRotation(snapshot)).toBe(2025);
    expect(leavesAtNextRotation(printing(2025), snapshot)).toBe(true);
    expect(
      showsRotatingTag({
        set: printing(2025),
        snapshot,
        formatKey: STANDARD_FORMAT_KEY,
        nextRotationFilter: true,
      })
    ).toBe(true);
  });

  test("the earliest booster of the year is the trigger, later ones are not", () => {
    const early = booster(2027, 2, 1);
    const later = booster(2027, 8, 1);
    const beforeEarly = buildRotationSnapshot([later, early], Date.UTC(2027, 0, 20));
    expect(beforeEarly.firstReleasedBoosterAt.has(2027)).toBe(false);

    const afterEarly = buildRotationSnapshot([later, early], Date.UTC(2027, 2, 1));
    expect(afterEarly.firstReleasedBoosterAt.get(2027)).toBe(early.releasedAt);
    expect(hasRotatedOutOfStandard(printing(2024), afterEarly)).toBe(true);
  });

  test("Future is a release date after today, independent of format", () => {
    expect(showsFutureTag({ releasedAt: Date.UTC(2026, 11, 1) }, SEP_21_2026)).toBe(true);
    expect(showsFutureTag({ releasedAt: Date.UTC(2026, 8, 21) }, SEP_21_2026)).toBe(false);
    expect(showsFutureTag({ releasedAt: Date.UTC(2026, 8, 20) }, SEP_21_2026)).toBe(false);
    expect(showsFutureTag({ printingYear: 2027 }, SEP_21_2026)).toBe(false);
    expect(showsFutureTag(undefined, SEP_21_2026)).toBe(false);
  });

  test("printing year prefers the explicit field over the release date year", () => {
    expect(
      resolvePrintingYear({
        printingYear: 2024,
        releasedAt: Date.UTC(2026, 6, 23, 20, 57, 41),
      })
    ).toBe(2024);
    expect(resolvePrintingYear({ releasedAt: Date.UTC(2024, 0, 15) })).toBe(2024);
    expect(resolvePrintingYear({})).toBe(null);
  });

  test("before the current year's first booster, next rotation is this year", () => {
    const snapshot = buildRotationSnapshot([booster(2027, 6, 1)], Date.UTC(2026, 0, 15));
    expect(nextRotationYear(snapshot)).toBe(2026);
    expect(printingYearLeavingAtNextRotation(snapshot)).toBe(2023);
  });
});
