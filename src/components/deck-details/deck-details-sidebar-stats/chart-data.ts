import type { GameDeckStatsChart } from "@/games/types";
import type { CachedCard } from "@/lib/universus/card-store";
import { toSortedBuckets } from "../deck-list-utils";

export interface DistributionBucket {
  label: string;
  value: number;
}

export interface DeckStatsEntry {
  card: CachedCard;
  quantity: number;
}

export interface DeckStatsChartData {
  chart: GameDeckStatsChart;
  buckets: DistributionBucket[];
  /** Cards counted by this chart (the chart's `filter` applied). */
  total: number;
}

type FormatCardType = (type?: string) => string | undefined;

function buildNumericDistribution(
  entries: readonly DeckStatsEntry[],
  extractor: (card: CachedCard) => number | undefined | null,
): DistributionBucket[] {
  const record: Record<string, number> = {};

  for (const entry of entries) {
    const value = extractor(entry.card);
    const key = typeof value === "number" ? String(value) : "None";
    record[key] = (record[key] ?? 0) + entry.quantity;
  }

  return Object.entries(record)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Number(a.label) - Number(b.label));
}

/** Integer curve from 0 (or the lowest value) to the highest, empty steps included; `None` last. */
export function buildCurveDistribution(
  entries: readonly DeckStatsEntry[],
  extractor: (card: CachedCard) => number | undefined | null,
): DistributionBucket[] {
  const record = new Map<number, number>();
  let none = 0;
  for (const entry of entries) {
    const value = extractor(entry.card);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      none += entry.quantity;
      continue;
    }
    record.set(value, (record.get(value) ?? 0) + entry.quantity);
  }

  const values = [...record.keys()];
  const buckets: DistributionBucket[] = [];
  if (values.length > 0) {
    let keys: number[];
    if (values.every((value) => Number.isInteger(value))) {
      const min = Math.min(0, ...values);
      const max = Math.max(...values);
      keys = Array.from({ length: max - min + 1 }, (_, index) => min + index);
    } else {
      keys = [...values].sort((a, b) => a - b);
    }
    for (const key of keys) buckets.push({ label: String(key), value: record.get(key) ?? 0 });
  }
  if (none > 0) buckets.push({ label: "None", value: none });
  return buckets;
}

function buildLabelDistribution(
  entries: readonly DeckStatsEntry[],
  labels: (card: CachedCard) => readonly string[],
  emptyLabel: string,
  order: readonly string[] | undefined,
): DistributionBucket[] {
  const record: Record<string, number> = {};
  for (const entry of entries) {
    const cardLabels = labels(entry.card);
    if (cardLabels.length === 0) {
      record[emptyLabel] = (record[emptyLabel] ?? 0) + entry.quantity;
      continue;
    }
    for (const label of cardLabels) {
      record[label] = (record[label] ?? 0) + entry.quantity;
    }
  }
  if (!order) return toSortedBuckets(record);

  const rank = (label: string) => {
    const index = order.indexOf(label);
    return index === -1 ? order.length : index;
  };
  return Object.entries(record)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => rank(a.label) - rank(b.label) || a.label.localeCompare(b.label));
}

/** Buckets + totals for each of the game's stats charts over the main-deck entries. */
export function buildDeckStatsChartData(
  charts: readonly GameDeckStatsChart[],
  mainEntries: readonly DeckStatsEntry[],
  formatCardType: FormatCardType,
): DeckStatsChartData[] {
  return charts.map((chart) => {
    const filter = chart.filter;
    const entries = filter ? mainEntries.filter((entry) => filter(entry.card, formatCardType)) : mainEntries;
    const total = entries.reduce((sum, entry) => sum + entry.quantity, 0);

    let buckets: DistributionBucket[];
    if (chart.kind === "cardType") {
      const record: Record<string, number> = {};
      for (const entry of entries) {
        const type = formatCardType(entry.card.type) ?? entry.card.type ?? "Other";
        record[type] = (record[type] ?? 0) + entry.quantity;
      }
      buckets = toSortedBuckets(record);
    } else if (chart.kind === "numeric") {
      buckets =
        chart.display === "bars"
          ? buildCurveDistribution(entries, chart.value)
          : buildNumericDistribution(entries, chart.value);
    } else {
      buckets = buildLabelDistribution(entries, chart.labels, chart.emptyLabel, chart.order);
    }

    return { chart, buckets, total };
  });
}
