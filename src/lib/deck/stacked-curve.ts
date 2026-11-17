/**
 * An integer curve (difficulty, check value, cost, ...) whose columns are split by card type, for
 * the compact stacked bars on the mobile Active Deck strip and panel.
 */
export interface StackedCurveColumn {
  value: number;
  /** Axis label: the value, or `"7+"` for an open-ended last column. */
  label: string;
  total: number;
  /** Per-type counts in `StackedCurve.types` order; zero counts are omitted. */
  segments: Array<{ type: string; count: number }>;
}

export interface StackedCurve {
  columns: StackedCurveColumn[];
  /** Card types present, most cards first (the stacking order, bottom to top). */
  types: string[];
  /** The tallest column's total. */
  max: number;
}

export interface StackedCurveEntry<Card> {
  card: Card;
  quantity: number;
}

export interface StackedCurveRange {
  /** First column. Lower values count toward it. Default: 0, or the lowest value if negative. */
  min?: number;
  /** Last column, open-ended (`"7+"`): higher values count toward it, and the range always reaches it. */
  max?: number;
}

/**
 * Buckets entries by `value(card)` across `range` (empty steps included) and splits each column by
 * `typeOf(card)`. Without `range.max`, the curve ends at the highest value present. Cards without a
 * numeric value are left out. An empty deck yields no columns.
 */
export function buildStackedCurve<Card>(
  entries: readonly StackedCurveEntry<Card>[],
  value: (card: Card) => number | null | undefined,
  typeOf: (card: Card) => string,
  range: StackedCurveRange = {}
): StackedCurve {
  const byValue = new Map<number, Map<string, number>>();
  const typeTotals = new Map<string, number>();

  for (const { card, quantity } of entries) {
    const raw = value(card);
    if (typeof raw !== "number" || !Number.isFinite(raw) || quantity <= 0) continue;
    let step = Math.round(raw);
    if (range.min !== undefined) step = Math.max(range.min, step);
    if (range.max !== undefined) step = Math.min(range.max, step);
    const type = typeOf(card);
    const column = byValue.get(step) ?? new Map<string, number>();
    column.set(type, (column.get(type) ?? 0) + quantity);
    byValue.set(step, column);
    typeTotals.set(type, (typeTotals.get(type) ?? 0) + quantity);
  }

  if (byValue.size === 0) return { columns: [], types: [], max: 0 };

  const types = [...typeTotals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([type]) => type);
  const steps = [...byValue.keys()];
  const low = range.min ?? Math.min(0, ...steps);
  const high = range.max ?? Math.max(...steps);

  const columns: StackedCurveColumn[] = [];
  for (let step = low; step <= high; step++) {
    const column = byValue.get(step);
    const segments = types
      .map((type) => ({ type, count: column?.get(type) ?? 0 }))
      .filter((segment) => segment.count > 0);
    columns.push({
      value: step,
      label: range.max !== undefined && step === range.max ? `${step}+` : String(step),
      total: segments.reduce((sum, segment) => sum + segment.count, 0),
      segments,
    });
  }

  return { columns, types, max: Math.max(...columns.map((column) => column.total)) };
}
