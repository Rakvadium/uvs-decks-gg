import { formatUniversusCardType } from "@/config/universus";
import {
  CARD_TYPE_LABELS,
  CARD_TYPE_ORDER,
} from "@/lib/deck/display-config";
import type { CachedCard } from "@/lib/universus/card-store";
import type { SectionGroup } from "./types";

export function buildSectionGroups(
  quantities: Record<string, number>,
  cardMap: Map<string, CachedCard>
): SectionGroup[] {
  const groups = new Map<string, Array<{ card: CachedCard; count: number }>>();

  for (const [cardId, count] of Object.entries(quantities)) {
    if (count <= 0) continue;

    const card = cardMap.get(cardId);
    if (!card) continue;

    const normalizedType = formatUniversusCardType(card.type) ?? card.type ?? "Other";
    const list = groups.get(normalizedType) ?? [];
    list.push({ card, count });
    groups.set(normalizedType, list);
  }

  for (const [, list] of groups) {
    list.sort((a, b) => {
      const aDifficulty = typeof a.card.difficulty === "number" ? a.card.difficulty : Number.POSITIVE_INFINITY;
      const bDifficulty = typeof b.card.difficulty === "number" ? b.card.difficulty : Number.POSITIVE_INFINITY;

      if (aDifficulty !== bDifficulty) return aDifficulty - bDifficulty;
      return a.card.name.localeCompare(b.card.name);
    });
  }

  const orderedTypes = [
    ...CARD_TYPE_ORDER,
    ...Array.from(groups.keys())
      .filter((type) => !CARD_TYPE_ORDER.includes(type as (typeof CARD_TYPE_ORDER)[number]))
      .sort(),
  ];

  return orderedTypes
    .filter((type) => groups.has(type))
    .map((type) => {
      const cards = groups.get(type) ?? [];
      const total = cards.reduce((sum, entry) => sum + entry.count, 0);

      return {
        type,
        label: CARD_TYPE_LABELS[type] ?? type,
        total,
        cards,
      };
    });
}
