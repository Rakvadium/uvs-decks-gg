import type { DeckTextLine } from "@shared/games/deck";
import { normalizeCardLookupKey, type CardNameIndex, type NamedCard } from "@shared/games/uvs/deck-text";

/**
 * All cards matching a deck-list name, best first: exact (case-insensitive) matches, else
 * normalized matches. `[0]` equals `findCardByName`; setup importers may prefer a later match
 * (e.g. the Legend printing of a name).
 */
export function findCardsByName<TCard extends NamedCard>(name: string, index: CardNameIndex<TCard>): TCard[] {
  const exact = index.exact.get(name.trim().toLowerCase());
  if (exact && exact.length > 0) return exact;
  return index.normalized.get(normalizeCardLookupKey(name)) ?? [];
}

/**
 * Export params for a setup's cards (in setup order; missing cards are skipped): `character` is the
 * first card (UVS starting character), `setupCards` all of them (Cyberpunk Legends).
 */
export function setupExportCards<TCard extends { name: string }>(
  setupCardIds: readonly string[],
  getCard: (id: string) => TCard | null | undefined,
): { character: TCard | null; setupCards: TCard[] } {
  const setupCards = setupCardIds.map((id) => getCard(id)).filter((card): card is TCard => Boolean(card));
  return { character: setupCards[0] ?? null, setupCards };
}

/** Total quantity per card name. */
export function sumDeckLines(entries: readonly DeckTextLine[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    counts[entry.name] = (counts[entry.name] ?? 0) + entry.quantity;
  }
  return counts;
}
