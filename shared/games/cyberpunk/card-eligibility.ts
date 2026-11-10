import type { DeckAddableCard } from "../deck";
import { isCyberpunkLegendType } from "./card-types";

/** Format default for Cyberpunk `standard` (`formats.defaultCopyLimit`). */
export const CYBERPUNK_DEFAULT_COPY_LIMIT = 3;

/**
 * Any card with a type other than Legend may go in the main deck. Legends are only added through
 * the deck setup. A missing card (not loaded yet) is allowed, like UVS.
 */
export function canAddCyberpunkCardToDeck(card: DeckAddableCard | null | undefined): boolean {
  if (!card) return true;
  const type = card.type?.trim();
  if (!type) return false;
  return !isCyberpunkLegendType(type);
}

/**
 * Per-card copy limit: `card.copyLimit` when positive, unlimited when `null` or `<= 0`
 * (same override semantics as UVS), else the format default (3).
 */
export function getCyberpunkCardCopyLimit(card: DeckAddableCard | null | undefined): number {
  if (!card) return Number.POSITIVE_INFINITY;
  if (card.copyLimit === null) return Number.POSITIVE_INFINITY;
  if (typeof card.copyLimit !== "number") return CYBERPUNK_DEFAULT_COPY_LIMIT;
  if (!Number.isFinite(card.copyLimit) || card.copyLimit <= 0) return Number.POSITIVE_INFINITY;
  return card.copyLimit;
}
