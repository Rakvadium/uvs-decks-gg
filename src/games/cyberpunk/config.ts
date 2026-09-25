/**
 * Cyberpunk TCG client helpers: card-type / color chip colors, type normalization, symbol (color
 * pip) classes. Colors derive from the shared module (`CYBERPUNK_COLOR_SWATCHES`).
 */
import {
  CYBERPUNK_COLORS,
  CYBERPUNK_COLOR_LABELS,
  CYBERPUNK_COLOR_SWATCHES,
  normalizeCyberpunkColor,
  type CyberpunkColor,
} from "@shared/games/cyberpunk/card-types";
import type { SymbolColorClasses } from "../types";

/** Canonical card types (display order: Legend first, then the deck groups). */
export const CYBERPUNK_CARD_TYPES = ["Legend", "Unit", "Gear", "Program"] as const;

/** Hex chip colors per card type (`Other` = unknown). */
export const CYBERPUNK_CARD_TYPE_COLORS: Readonly<Record<string, string>> = {
  Legend: "#F5C518",
  Unit: "#22D3EE",
  Gear: "#F97316",
  Program: "#A855F7",
  Other: "#94A3B8",
};

/** Neutral hex for colorless cards. */
export const CYBERPUNK_COLORLESS_HEX = "#94A3B8";

function hslTripletToHex(triplet: string): string {
  const [hRaw, sRaw, lRaw] = triplet.split(/\s+/);
  const h = Number.parseFloat(hRaw);
  const s = Number.parseFloat(sRaw) / 100;
  const l = Number.parseFloat(lRaw) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const value = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

/** Hex per card color, derived from the shared swatches. */
export const CYBERPUNK_COLOR_HEX: Readonly<Record<CyberpunkColor, string>> = Object.fromEntries(
  CYBERPUNK_COLORS.map((color) => [color, hslTripletToHex(CYBERPUNK_COLOR_SWATCHES[color])]),
) as Record<CyberpunkColor, string>;

export function isCyberpunkColor(value: string | null | undefined): value is CyberpunkColor {
  return typeof value === "string" && (CYBERPUNK_COLORS as readonly string[]).includes(value);
}

/** Normalized known color (`"Red"` → `"red"`), or `null` for colorless / unknown. */
export function cyberpunkCardColor(color: string | null | undefined): CyberpunkColor | null {
  const normalized = normalizeCyberpunkColor(color);
  return isCyberpunkColor(normalized) ? normalized : null;
}

/** Hex for a card color (`CYBERPUNK_COLORLESS_HEX` for colorless / unknown). */
export function getCyberpunkColorHex(color: string | null | undefined): string {
  const known = cyberpunkCardColor(color);
  return known ? CYBERPUNK_COLOR_HEX[known] : CYBERPUNK_COLORLESS_HEX;
}

export function getCyberpunkColorLabel(color: string | null | undefined): string {
  const known = cyberpunkCardColor(color);
  if (known) return CYBERPUNK_COLOR_LABELS[known];
  return color?.trim() ? color.trim() : "Colorless";
}

/** Normalizes a raw type (`"unit"` → `"Unit"`); unknown types pass through unchanged. */
export function formatCyberpunkCardType(type?: string): string | undefined {
  if (!type) return undefined;
  const trimmed = type.trim();
  const match = CYBERPUNK_CARD_TYPES.find((known) => known.toLowerCase() === trimmed.toLowerCase());
  return match ?? type;
}

export function getCyberpunkCardTypeColor(type: string): string {
  const formatted = formatCyberpunkCardType(type);
  return (formatted && CYBERPUNK_CARD_TYPE_COLORS[formatted]) || CYBERPUNK_CARD_TYPE_COLORS.Other;
}

/** Keyword chips share one accent (Cyberpunk keywords have no timing groups). */
export function getCyberpunkKeywordColor(): string {
  return "#22D3EE";
}

const COLOR_CLASSES: Record<CyberpunkColor, SymbolColorClasses> = {
  red: { bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/60" },
  green: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/60" },
  blue: { bg: "bg-sky-500/20", text: "text-sky-300", border: "border-sky-500/60" },
  yellow: { bg: "bg-yellow-400/20", text: "text-yellow-200", border: "border-yellow-400/60" },
};

/** Chip classes for a color "symbol" (Cyberpunk has colors instead of UVS symbols). */
export function getCyberpunkSymbolColor(symbol: string): SymbolColorClasses {
  const known = cyberpunkCardColor(symbol);
  return known ? COLOR_CLASSES[known] : { bg: "bg-muted", text: "text-muted-foreground", border: "border-muted" };
}

/** Cyberpunk has no symbol images; colors render as pips. */
export function getCyberpunkSymbolPath(): string | null {
  return null;
}

/**
 * Title + subtitle for display. Imported names may already include the subname
 * (`"V: Streetkid"` + `"Streetkid"`); the title drops that suffix.
 */
export function cyberpunkCardTitle(card: { name: string; subname?: string | null }): {
  title: string;
  subname: string | null;
} {
  const subname = card.subname?.trim() || null;
  if (!subname) return { title: card.name, subname: null };
  const suffix = `: ${subname}`;
  const title = card.name.toLowerCase().endsWith(suffix.toLowerCase())
    ? card.name.slice(0, -suffix.length).trim()
    : card.name;
  return { title: title || card.name, subname };
}
