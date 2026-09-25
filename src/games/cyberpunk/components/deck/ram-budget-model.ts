/**
 * RAM budget summary view model (pure): per color, the RAM the Legends provide vs what the main
 * deck asks for, mirroring the `COLOR_NOT_PROVIDED` / `RAM_EXCEEDS_BUDGET` validation rules.
 */
import {
  CYBERPUNK_COLOR_LABELS,
  CYBERPUNK_COLOR_SWATCHES,
  CYBERPUNK_COLORS,
  isCyberpunkLegendType,
  normalizeCyberpunkColor,
  type CyberpunkColor,
} from "@shared/games/cyberpunk/card-types";
import { cyberpunkRamBudget } from "@shared/games/cyberpunk/rules";
import { legendNameKey, type LegendCardLike } from "./legend-model";

export interface RamBudgetCard {
  name: string;
  subname?: string;
  type?: string;
  color?: string;
  ram?: number | null;
}

export interface RamBudgetRow {
  color: string;
  label: string;
  /** HSL triplet (`"350 90% 55%"`), `null` for colors outside the known four. */
  swatch: string | null;
  /** RAM of this color the Legends provide. */
  budget: number;
  /** Main-deck cards (copies) of this color. */
  cardCount: number;
  /** Highest RAM requirement among those cards (0 when none). */
  maxRam: number;
  /** Copies that break the budget (no Legend of the color, or RAM above the budget). */
  overBudgetCount: number;
}

export interface RamBudgetSummary {
  rows: RamBudgetRow[];
  /** Total over-budget copies across colors. */
  overBudgetCount: number;
  /** Main-deck copies without a color (no RAM check). */
  colorlessCount: number;
}

function ramOf(card: { ram?: number | null }): number {
  return typeof card.ram === "number" && Number.isFinite(card.ram) ? card.ram : 0;
}

/** Legends that count toward the budget (Legend type, first of each name), like deck validation. */
export function budgetLegends<TCard extends Pick<LegendCardLike, "name" | "subname" | "type">>(legends: readonly TCard[]): TCard[] {
  const seen = new Set<string>();
  return legends.filter((legend) => {
    if (!isCyberpunkLegendType(legend.type)) return false;
    const key = legendNameKey(legend);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Rows for colors that have a budget or main-deck cards, in the official color order (unknown
 * colors last, alphabetically).
 */
export function buildRamBudgetSummary(
  legends: readonly RamBudgetCard[],
  mainEntries: readonly { card: RamBudgetCard; quantity: number }[],
): RamBudgetSummary {
  const budget = cyberpunkRamBudget(budgetLegends(legends));
  const usage = new Map<string, { cardCount: number; maxRam: number; overBudgetCount: number }>();
  let colorlessCount = 0;

  for (const { card, quantity } of mainEntries) {
    if (quantity <= 0 || isCyberpunkLegendType(card.type)) continue;
    const color = normalizeCyberpunkColor(card.color);
    if (!color) {
      colorlessCount += quantity;
      continue;
    }
    const available = budget.get(color) ?? 0;
    const ram = ramOf(card);
    const row = usage.get(color) ?? { cardCount: 0, maxRam: 0, overBudgetCount: 0 };
    row.cardCount += quantity;
    row.maxRam = Math.max(row.maxRam, ram);
    if (available <= 0 || ram > available) row.overBudgetCount += quantity;
    usage.set(color, row);
  }

  const known = CYBERPUNK_COLORS as readonly string[];
  const colors = [...new Set([...budget.keys(), ...usage.keys()])]
    .filter((color) => (budget.get(color) ?? 0) > 0 || usage.has(color))
    .sort((a, b) => {
      const rankA = known.indexOf(a) === -1 ? known.length : known.indexOf(a);
      const rankB = known.indexOf(b) === -1 ? known.length : known.indexOf(b);
      return rankA - rankB || a.localeCompare(b);
    });

  const rows = colors.map((color): RamBudgetRow => {
    const isKnown = known.includes(color);
    const used = usage.get(color);
    return {
      color,
      label: isKnown ? CYBERPUNK_COLOR_LABELS[color as CyberpunkColor] : color.charAt(0).toUpperCase() + color.slice(1),
      swatch: isKnown ? CYBERPUNK_COLOR_SWATCHES[color as CyberpunkColor] : null,
      budget: budget.get(color) ?? 0,
      cardCount: used?.cardCount ?? 0,
      maxRam: used?.maxRam ?? 0,
      overBudgetCount: used?.overBudgetCount ?? 0,
    };
  });

  return {
    rows,
    overBudgetCount: rows.reduce((sum, row) => sum + row.overBudgetCount, 0),
    colorlessCount,
  };
}
