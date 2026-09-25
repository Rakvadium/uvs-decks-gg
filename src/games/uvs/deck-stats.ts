import type { GameDeckStatsPalette } from "../types";
import { UNIVERSUS_COLORS } from "./config";

/** UVS deck stats sidebar pie-chart colors. */
export const UVS_DECK_STATS_PALETTE = {
  cardTypeColors: {
    Character: UNIVERSUS_COLORS.CHARACTER,
    Attack: UNIVERSUS_COLORS.ATTACK,
    Action: UNIVERSUS_COLORS.ACTION,
    Asset: UNIVERSUS_COLORS.ASSET,
    Foundation: UNIVERSUS_COLORS.FOUNDATION,
    Backup: UNIVERSUS_COLORS.BACKUP,
    Token: UNIVERSUS_COLORS.TOKEN,
    Arena: UNIVERSUS_COLORS.ARENA,
    Other: "#94a3b8",
  },
  zoneColors: {
    High: UNIVERSUS_COLORS.HIGH,
    Mid: UNIVERSUS_COLORS.MID,
    Low: UNIVERSUS_COLORS.LOW,
    None: "#64748b",
  },
  numericShades: {
    characterNumeric: ["#8C498D", "#A35FA5", "#BA7BBC", "#D197D4", "#E5B3E6", "#C084FC"],
    actionNumeric: ["#0081C9", "#1A93D4", "#33A5DF", "#4DB7EA", "#66C9F5", "#38BDF8"],
    foundationNumeric: ["#7D8D97", "#8F9DA6", "#A1ADB5", "#B3BDC4", "#C5CDD3", "#94A3B8"],
    attackNumeric: ["#F1841B", "#F39A3C", "#F5B05D", "#F7C67E", "#F9DC9F", "#FB8920"],
  },
} as const satisfies GameDeckStatsPalette;
