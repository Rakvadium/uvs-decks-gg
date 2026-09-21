/**
 * Standard rotation from set release data.
 *
 * A printing leaves Standard when the first booster set of (printing year + 3)
 * has a release date on or before today. Deck and other products never start
 * that clock. Dates are UTC calendar days, matching date-only release inputs
 * stored as UTC midnight.
 */

export const STANDARD_FORMAT_KEY = "standard";
export const ROTATION_LAG_YEARS = 3;

export type SetProductKind = "booster" | "other";

export interface RotationSetInput {
  releasedAt?: number;
  printingYear?: number;
  productKind?: SetProductKind;
}

export interface RotationSnapshot {
  now: number;
  todayYear: number;
  /** Release year -> earliest releasedAt of a booster whose UTC day is on or before today. */
  firstReleasedBoosterAt: ReadonlyMap<number, number>;
}

export function utcCalendarParts(ms: number): { year: number; month: number; day: number } {
  const date = new Date(ms);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function utcDayNumber(ms: number): number {
  const parts = utcCalendarParts(ms);
  return parts.year * 10000 + parts.month * 100 + parts.day;
}

export function isReleaseAfterToday(releasedAt: number | undefined, now: number): boolean {
  if (releasedAt === undefined || !Number.isFinite(releasedAt)) return false;
  return utcDayNumber(releasedAt) > utcDayNumber(now);
}

export function isReleaseOnOrBeforeToday(releasedAt: number | undefined, now: number): boolean {
  if (releasedAt === undefined || !Number.isFinite(releasedAt)) return false;
  return utcDayNumber(releasedAt) <= utcDayNumber(now);
}

export function resolvePrintingYear(set: RotationSetInput): number | null {
  if (set.printingYear !== undefined && Number.isInteger(set.printingYear)) {
    return set.printingYear;
  }
  if (set.releasedAt !== undefined && Number.isFinite(set.releasedAt)) {
    return utcCalendarParts(set.releasedAt).year;
  }
  return null;
}

export function buildRotationSnapshot(
  sets: readonly RotationSetInput[],
  now: number
): RotationSnapshot {
  const firstReleasedBoosterAt = new Map<number, number>();
  for (const set of sets) {
    if (set.productKind !== "booster") continue;
    if (set.releasedAt === undefined || !Number.isFinite(set.releasedAt)) continue;
    if (!isReleaseOnOrBeforeToday(set.releasedAt, now)) continue;
    const year = utcCalendarParts(set.releasedAt).year;
    const current = firstReleasedBoosterAt.get(year);
    if (current === undefined || set.releasedAt < current) {
      firstReleasedBoosterAt.set(year, set.releasedAt);
    }
  }
  return {
    now,
    todayYear: utcCalendarParts(now).year,
    firstReleasedBoosterAt,
  };
}

export function hasRotatedOutOfStandard(
  set: RotationSetInput,
  snapshot: RotationSnapshot
): boolean {
  const year = resolvePrintingYear(set);
  if (year === null) return false;
  return snapshot.firstReleasedBoosterAt.has(year + ROTATION_LAG_YEARS);
}

export function isInAutomaticRotatingWindow(
  set: RotationSetInput,
  snapshot: RotationSnapshot
): boolean {
  const year = resolvePrintingYear(set);
  if (year === null) return false;
  const rotationYear = year + ROTATION_LAG_YEARS;
  if (snapshot.todayYear !== rotationYear) return false;
  return !snapshot.firstReleasedBoosterAt.has(rotationYear);
}

export function nextRotationYear(snapshot: RotationSnapshot): number {
  if (!snapshot.firstReleasedBoosterAt.has(snapshot.todayYear)) {
    return snapshot.todayYear;
  }
  return snapshot.todayYear + 1;
}

export function printingYearLeavingAtNextRotation(snapshot: RotationSnapshot): number {
  return nextRotationYear(snapshot) - ROTATION_LAG_YEARS;
}

export function leavesAtNextRotation(
  set: RotationSetInput,
  snapshot: RotationSnapshot
): boolean {
  const year = resolvePrintingYear(set);
  return year !== null && year === printingYearLeavingAtNextRotation(snapshot);
}

export function showsFutureTag(set: RotationSetInput | undefined, now: number): boolean {
  if (!set) return false;
  return isReleaseAfterToday(set.releasedAt, now);
}

export function showsRotatingTag(args: {
  set: RotationSetInput | undefined;
  snapshot: RotationSnapshot;
  formatKey: string | undefined;
  nextRotationFilter: boolean;
}): boolean {
  if (args.formatKey !== STANDARD_FORMAT_KEY || !args.set) return false;
  if (isInAutomaticRotatingWindow(args.set, args.snapshot)) return true;
  return args.nextRotationFilter && leavesAtNextRotation(args.set, args.snapshot);
}
