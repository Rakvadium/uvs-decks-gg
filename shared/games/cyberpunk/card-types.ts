/** Cyberpunk TCG card types, colors and small card helpers (pure TS). */

export const CYBERPUNK_LEGEND_TYPE = "Legend";

/** Display order of main-deck card-type groups (Legends live in the setup, not the main deck). */
export const CYBERPUNK_CARD_TYPE_ORDER = ["Unit", "Gear", "Program"] as const;

/** Plural group labels keyed by card type. */
export const CYBERPUNK_CARD_TYPE_LABELS: Record<string, string> = {
  Legend: "Legends",
  Unit: "Units",
  Gear: "Gear",
  Program: "Programs",
};

export const CYBERPUNK_COLORS = ["red", "green", "blue", "yellow"] as const;

export type CyberpunkColor = (typeof CYBERPUNK_COLORS)[number];

export const CYBERPUNK_COLOR_LABELS: Record<CyberpunkColor, string> = {
  red: "Red",
  green: "Green",
  blue: "Blue",
  yellow: "Yellow",
};

/** HSL triplets for color chips/swatches. */
export const CYBERPUNK_COLOR_SWATCHES: Record<CyberpunkColor, string> = {
  red: "350 90% 55%",
  green: "142 70% 45%",
  blue: "210 90% 56%",
  yellow: "55 98% 51%",
};

/** Case-insensitive type check (`"legend"`, `"Legend"`). */
export function isCyberpunkLegendType(type: string | null | undefined): boolean {
  return typeof type === "string" && type.trim().toLowerCase() === "legend";
}

/** Normalized color key (`"Red "` → `"red"`), or `null` for colorless / empty. */
export function normalizeCyberpunkColor(color: string | null | undefined): string | null {
  const value = color?.trim().toLowerCase();
  return value ? value : null;
}
