import { CYBERPUNK_COLOR_LABELS, CYBERPUNK_COLORS, type CyberpunkColor } from "@shared/games/cyberpunk/card-types";
import type { GameDeckStatsChart, GameDeckStatsPalette } from "../types";
import {
  CYBERPUNK_CARD_TYPE_COLORS,
  CYBERPUNK_COLOR_HEX,
  CYBERPUNK_COLORLESS_HEX,
  cyberpunkCardColor,
  getCyberpunkColorLabel,
} from "./config";

/** Cyberpunk deck stats pie colors (card types; colors as "zones"; cost/RAM ramps). */
export const CYBERPUNK_DECK_STATS_PALETTE = {
  cardTypeColors: CYBERPUNK_CARD_TYPE_COLORS,
  zoneColors: {
    Red: CYBERPUNK_COLOR_HEX.red,
    Green: CYBERPUNK_COLOR_HEX.green,
    Blue: CYBERPUNK_COLOR_HEX.blue,
    Yellow: CYBERPUNK_COLOR_HEX.yellow,
    None: CYBERPUNK_COLORLESS_HEX,
  },
  numericShades: {
    costNumeric: ["#F5C518", "#F7D04A", "#F9DB7B", "#FBE6AD", "#E8B10F", "#C9960A"],
    ramNumeric: ["#22D3EE", "#4FDDF2", "#7CE7F5", "#A9F0F9", "#14B8D4", "#0E9AB2"],
    powerNumeric: ["#F43F5E", "#F66580", "#F98BA1", "#FBB1C2", "#DC2F4E", "#B8233F"],
  },
} as const satisfies GameDeckStatsPalette;

const COLORLESS_LABEL = "Colorless";

/** Pie colors for the color distribution, keyed by color label. */
const COLOR_LABEL_HEX: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    CYBERPUNK_COLORS.map((color) => [CYBERPUNK_COLOR_LABELS[color as CyberpunkColor], CYBERPUNK_COLOR_HEX[color]]),
  ),
  [COLORLESS_LABEL]: CYBERPUNK_COLORLESS_HEX,
};

/** Cyberpunk deck stats sidebar charts: cost curve, colors, card types. */
export const CYBERPUNK_DECK_STATS_CHARTS: readonly GameDeckStatsChart[] = [
  {
    id: "cost",
    title: "Cost Curve",
    kind: "numeric",
    value: (card) => card.cost,
    display: "bars",
    colorStrategy: "costNumeric",
  },
  {
    id: "color",
    title: "Colors",
    kind: "labels",
    labels: (card) => (cyberpunkCardColor(card.color) ? [getCyberpunkColorLabel(card.color)] : []),
    emptyLabel: COLORLESS_LABEL,
    order: [...CYBERPUNK_COLORS.map((color) => CYBERPUNK_COLOR_LABELS[color]), COLORLESS_LABEL],
    colorStrategy: "default",
    labelColors: COLOR_LABEL_HEX,
  },
  { id: "type", title: "Card Types", kind: "cardType", colorStrategy: "cardTypeLabels" },
];
