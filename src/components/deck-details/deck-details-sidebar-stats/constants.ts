import { UNIVERSUS_COLORS } from "@/config/universus";

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

const CARD_TYPE_PIE_COLORS: Record<string, string> = {
  Character: UNIVERSUS_COLORS.CHARACTER,
  Attack: UNIVERSUS_COLORS.ATTACK,
  Action: UNIVERSUS_COLORS.ACTION,
  Asset: UNIVERSUS_COLORS.ASSET,
  Foundation: UNIVERSUS_COLORS.FOUNDATION,
  Backup: UNIVERSUS_COLORS.BACKUP,
  Token: "#9ca3af",
  Other: "#94a3b8",
};

const ZONE_PIE_COLORS: Record<string, string> = {
  High: UNIVERSUS_COLORS.HIGH,
  Mid: UNIVERSUS_COLORS.MID,
  Low: UNIVERSUS_COLORS.LOW,
  None: "#64748b",
};

const CHARACTER_NUMERIC_SHADES = ["#8C498D", "#A35FA5", "#BA7BBC", "#D197D4", "#E5B3E6", "#C084FC"];
const ACTION_NUMERIC_SHADES = ["#0081C9", "#1A93D4", "#33A5DF", "#4DB7EA", "#66C9F5", "#38BDF8"];
const FOUNDATION_NUMERIC_SHADES = ["#7D8D97", "#8F9DA6", "#A1ADB5", "#B3BDC4", "#C5CDD3", "#94A3B8"];
const ATTACK_NUMERIC_SHADES = ["#F1841B", "#F39A3C", "#F5B05D", "#F7C67E", "#F9DC9F", "#FB8920"];

export function resolvePieBucketColor(
  strategy: PieChartColorStrategy,
  label: string,
  index: number
): string {
  if (strategy === "default") {
    return PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
  }

  if (strategy === "cardTypeLabels") {
    return CARD_TYPE_PIE_COLORS[label] ?? CARD_TYPE_PIE_COLORS.Other;
  }

  if (strategy === "zoneLabels") {
    return ZONE_PIE_COLORS[label] ?? ZONE_PIE_COLORS.None;
  }

  if (strategy === "characterNumeric") {
    return CHARACTER_NUMERIC_SHADES[index % CHARACTER_NUMERIC_SHADES.length];
  }

  if (strategy === "actionNumeric") {
    return ACTION_NUMERIC_SHADES[index % ACTION_NUMERIC_SHADES.length];
  }

  if (strategy === "foundationNumeric") {
    return FOUNDATION_NUMERIC_SHADES[index % FOUNDATION_NUMERIC_SHADES.length];
  }

  return ATTACK_NUMERIC_SHADES[index % ATTACK_NUMERIC_SHADES.length];
}
