/**
 * Game-agnostic deck validation helpers shared by every game's rules (pure TS).
 */
import type { DeckRuleCard, DeckRuleFormat, DeckRuleLegality, DeckValidationError } from "./deck";

export function sumQuantityValues(quantities: Record<string, number>): number {
  return Object.values(quantities).reduce((sum, count) => sum + count, 0);
}

export function positiveQuantityIds(quantities: Record<string, number>): string[] {
  return Object.keys(quantities).filter((id) => (quantities[id] ?? 0) > 0);
}

/** `card.copyLimit` overrides the format default; `null` means unlimited. */
export function effectivePerCardCopyLimit(card: DeckRuleCard, format: DeckRuleFormat): number | null {
  if (card.copyLimit === null) return null;
  return card.copyLimit ?? format.defaultCopyLimit;
}

/**
 * UVS standard: strictest limit across printings, never above the format default (a higher
 * per-card `copyLimit` is not honored); `null` when any printing is unlimited.
 */
export function groupEffectiveCopyLimit(cards: readonly DeckRuleCard[], format: DeckRuleFormat): number | null {
  let minFinite = format.defaultCopyLimit;
  for (const card of cards) {
    const lim = effectivePerCardCopyLimit(card, format);
    if (lim === null) return null;
    minFinite = Math.min(minFinite, lim);
  }
  return minFinite;
}

/**
 * Strictest effective limit across printings of one card (a per-card `copyLimit` may raise or
 * lower the format default); `null` when any printing is unlimited.
 */
export function strictestPrintingCopyLimit(cards: readonly DeckRuleCard[], format: DeckRuleFormat): number | null {
  let min = Number.POSITIVE_INFINITY;
  for (const card of cards) {
    const lim = effectivePerCardCopyLimit(card, format);
    if (lim === null) return null;
    min = Math.min(min, lim);
  }
  return Number.isFinite(min) ? min : format.defaultCopyLimit;
}

export function legalityApplies(entry: DeckRuleLegality, now: number): boolean {
  return entry.effectiveDate === undefined || entry.effectiveDate <= now;
}

/** Last row per card wins (matches the index iteration order the loader passes in). */
export function buildLegalityMap(rows: readonly DeckRuleLegality[]): Map<string, DeckRuleLegality> {
  const map = new Map<string, DeckRuleLegality>();
  for (const row of rows) {
    map.set(row.cardId.toString(), row);
  }
  return map;
}

export interface SideboardMessages {
  exact: (exactSize: number, sideCount: number) => string;
}

/** Sideboard size rule (`exact:N` allows 0 or N, `max:N`); unparseable/unknown rules are ignored. */
export function checkSideboardRule<TCardId extends string>(
  sideCount: number,
  format: DeckRuleFormat,
  messages: SideboardMessages,
): DeckValidationError<TCardId>[] {
  const errors: DeckValidationError<TCardId>[] = [];
  if (format.sideboardRule.startsWith("exact:")) {
    const exactSize = parseInt(format.sideboardRule.split(":")[1] ?? "", 10);
    if (Number.isFinite(exactSize) && sideCount !== 0 && sideCount !== exactSize) {
      errors.push({
        code: "INVALID_SIDEBOARD_SIZE",
        message: messages.exact(exactSize, sideCount),
      });
    }
  } else if (format.sideboardRule.startsWith("max:")) {
    const maxSize = parseInt(format.sideboardRule.split(":")[1] ?? "", 10);
    if (Number.isFinite(maxSize) && sideCount > maxSize) {
      errors.push({
        code: "SIDEBOARD_TOO_LARGE",
        message: `Sideboard has ${sideCount} cards, maximum is ${maxSize}`,
      });
    }
  }
  return errors;
}
