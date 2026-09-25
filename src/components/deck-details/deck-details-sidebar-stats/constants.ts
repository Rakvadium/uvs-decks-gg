import type { GameDeckStatsPalette } from "@/games/types";

export const PIE_CHART_COLORS = [
  "#22d3ee",
  "#f59e0b",
  "#34d399",
  "#f472b6",
  "#60a5fa",
  "#f97316",
  "#a78bfa",
  "#fb7185",
];

export type PieChartColorStrategy =
  | "default"
  | "cardTypeLabels"
  | "zoneLabels"
  | "characterNumeric"
  | "actionNumeric"
  | "foundationNumeric"
  | "attackNumeric";

export function resolvePieBucketColor(
  strategy: PieChartColorStrategy,
  label: string,
  index: number,
  palette: GameDeckStatsPalette
): string {
  if (strategy === "default") {
    return PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
  }

  if (strategy === "cardTypeLabels") {
    return palette.cardTypeColors[label] ?? palette.cardTypeColors.Other;
  }

  if (strategy === "zoneLabels") {
    return palette.zoneColors[label] ?? palette.zoneColors.None;
  }

  const shades = palette.numericShades[strategy] ?? PIE_CHART_COLORS;
  return shades[index % shades.length];
}
