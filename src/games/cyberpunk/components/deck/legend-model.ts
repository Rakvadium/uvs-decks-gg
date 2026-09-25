/**
 * Pure Cyberpunk deck setup helpers (Legend picker filtering, slot edits, add-to-setup, import).
 * No React; tested in `tests/cyberpunk-deck-setup-ui.test.ts`.
 */
import {
  CYBERPUNK_COLORS,
  isCyberpunkLegendType,
  normalizeCyberpunkColor,
} from "@shared/games/cyberpunk/card-types";
import { cyberpunkLegendNameKey } from "@shared/games/cyberpunk/rules";
import { CYBERPUNK_LEGEND_COUNT } from "@shared/games/cyberpunk/setup";
import type { DeckTextLine } from "@shared/games/deck";

/** Card fields the Legend helpers read (structural, so `CachedCard` and test fixtures fit). */
export interface LegendCardLike {
  _id: string;
  name: string;
  type?: string;
  color?: string;
  ram?: number | null;
  subname?: string;
  isFrontFace?: boolean;
  isVariant?: boolean;
}

/** Legend names must differ: the name without its version subtitle, case-insensitive (deck validation's key). */
export function legendNameKey(card: Pick<LegendCardLike, "name" | "subname">): string {
  return cyberpunkLegendNameKey(card);
}

/** Display name: `Name, Subname` when the card has a subtitle the name doesn't already include. */
export function legendDisplayName(card: Pick<LegendCardLike, "name" | "subname">): string {
  const subname = card.subname?.trim();
  if (!subname || card.name.toLowerCase().includes(subname.toLowerCase())) return card.name;
  return `${card.name}, ${subname}`;
}

/** Legends offered by the picker: Legend-type front faces, no alternate-art variants. */
export function isLegendPickerCandidate(card: LegendCardLike): boolean {
  return isCyberpunkLegendType(card.type) && card.isFrontFace !== false && card.isVariant !== true;
}

function colorRank(color: string | undefined): number {
  const key = normalizeCyberpunkColor(color);
  const index = key ? (CYBERPUNK_COLORS as readonly string[]).indexOf(key) : -1;
  return index === -1 ? CYBERPUNK_COLORS.length : index;
}

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface LegendPickerOption<TCard extends LegendCardLike> {
  card: TCard;
  selected: boolean;
  /** Why the card can't be picked right now (`null` = pickable / removable). */
  disabledReason: string | null;
}

export interface LegendPickerQuery<TCard extends LegendCardLike> {
  cards: readonly TCard[];
  legendIds: readonly string[];
  getCard: (id: string) => LegendCardLike | null | undefined;
  search?: string;
  /** Lowercase color keys; empty = every color. */
  colors?: readonly string[];
  /** Replace mode: the slot being filled (its current Legend doesn't block names). */
  slotIndex?: number | null;
}

/**
 * Picker rows: Legend cards matching the search (name + subname) and color filter, sorted by color
 * then name. Disabled when all slots are full, the card is chosen in another slot, or a chosen
 * Legend already has the same name.
 */
export function buildLegendPickerOptions<TCard extends LegendCardLike>({
  cards,
  legendIds,
  getCard,
  search,
  colors,
  slotIndex,
}: LegendPickerQuery<TCard>): LegendPickerOption<TCard>[] {
  const replaceMode = typeof slotIndex === "number";
  const replacedId = replaceMode ? legendIds[slotIndex] : undefined;
  const otherIds = legendIds.filter((id) => id !== replacedId);
  const takenNames = new Map<string, string>();
  for (const id of otherIds) {
    const legend = getCard(id);
    if (legend) takenNames.set(legendNameKey(legend), legendDisplayName(legend));
  }
  const slotsFull = !replaceMode && legendIds.length >= CYBERPUNK_LEGEND_COUNT;
  const query = search ? normalizeSearch(search) : "";
  const colorSet = colors && colors.length > 0 ? new Set(colors) : null;

  return cards
    .filter((card) => {
      if (!isLegendPickerCandidate(card)) return false;
      if (colorSet && !colorSet.has(normalizeCyberpunkColor(card.color) ?? "")) return false;
      if (query && !normalizeSearch(legendDisplayName(card)).includes(query)) return false;
      return true;
    })
    .sort((a, b) => colorRank(a.color) - colorRank(b.color) || legendDisplayName(a).localeCompare(legendDisplayName(b)))
    .map((card) => {
      const selected = legendIds.includes(card._id);
      let disabledReason: string | null = null;
      if (replaceMode) {
        if (selected && card._id !== replacedId) disabledReason = "Already one of your Legends";
      } else if (!selected && slotsFull) {
        disabledReason = `All ${CYBERPUNK_LEGEND_COUNT} Legend slots are full`;
      }
      if (!disabledReason && !(selected && (!replaceMode || card._id === replacedId))) {
        const clash = takenNames.get(legendNameKey(card));
        if (clash) disabledReason = `A Legend named ${clash} is already chosen`;
      }
      return { card, selected, disabledReason };
    });
}

/**
 * Legend ids after a pick. Replace mode (`slotIndex`) puts the card in that slot (appends when the
 * slot is empty); toggle mode removes a chosen Legend or appends a new one while slots remain.
 */
export function applyLegendPick(
  legendIds: readonly string[],
  cardId: string,
  slotIndex?: number | null,
): string[] {
  if (typeof slotIndex === "number") {
    if (legendIds[slotIndex] === cardId) return [...legendIds];
    const without = legendIds.filter((id) => id !== cardId);
    if (slotIndex < without.length) {
      const next = [...without];
      next[slotIndex] = cardId;
      return next;
    }
    return without.length < CYBERPUNK_LEGEND_COUNT ? [...without, cardId] : without;
  }
  if (legendIds.includes(cardId)) return legendIds.filter((id) => id !== cardId);
  return legendIds.length < CYBERPUNK_LEGEND_COUNT ? [...legendIds, cardId] : [...legendIds];
}

export type LegendAddResolution =
  | { kind: "add"; message: string; actionLabel: string; legendIds: string[] }
  | { kind: "blocked"; message: string };

/**
 * A Legend was added to the main deck: offer the Legend slots instead, or explain why it can't go
 * there. `null` when the card isn't a Legend.
 */
export function resolveLegendAdd(
  card: LegendCardLike,
  legendIds: readonly string[],
  getCard: (id: string) => LegendCardLike | null | undefined,
): LegendAddResolution | null {
  if (!isCyberpunkLegendType(card.type)) return null;
  if (legendIds.includes(card._id)) {
    return { kind: "blocked", message: `${card.name} is already one of your Legends.` };
  }
  if (legendIds.length >= CYBERPUNK_LEGEND_COUNT) {
    return {
      kind: "blocked",
      message: `Legends don't go in the main deck, and all ${CYBERPUNK_LEGEND_COUNT} Legend slots are full.`,
    };
  }
  const clash = legendIds
    .map((id) => getCard(id))
    .find((legend) => legend && legendNameKey(legend) === legendNameKey(card));
  if (clash) {
    return {
      kind: "blocked",
      message: `Legends need different names, and ${legendDisplayName(clash)} is already one of your Legends.`,
    };
  }
  return {
    kind: "add",
    message: `${card.name} is a Legend. Legends go in the Legend slots, not the main deck.`,
    actionLabel: "Add as Legend",
    legendIds: [...legendIds, card._id],
  };
}

export interface LegendImportResult {
  /** `null` when the text had no resolvable Legends (keep the current ones). */
  legendIds: string[] | null;
  unresolved: string[];
}

/**
 * Legends from an imported list: each line resolves to its first Legend-type match; repeated cards
 * and names are skipped; at most `CYBERPUNK_LEGEND_COUNT` are kept.
 */
export function resolveImportedLegends(
  lines: readonly DeckTextLine[] | undefined,
  findCards: (name: string) => readonly LegendCardLike[],
): LegendImportResult {
  if (!lines || lines.length === 0) return { legendIds: null, unresolved: [] };
  const legendIds: string[] = [];
  const names = new Set<string>();
  const unresolved: string[] = [];
  for (const line of lines) {
    const legend = findCards(line.name).find((card) => isCyberpunkLegendType(card.type));
    if (!legend) {
      unresolved.push(line.name);
      continue;
    }
    const key = legendNameKey(legend);
    if (legendIds.includes(legend._id) || names.has(key) || legendIds.length >= CYBERPUNK_LEGEND_COUNT) continue;
    legendIds.push(legend._id);
    names.add(key);
  }
  return { legendIds: legendIds.length > 0 ? legendIds : null, unresolved };
}
