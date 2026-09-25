/**
 * Game identity + the shared (runtime-agnostic) game module contract.
 * Pure TS: safe to import from convex/ (relative path) and src/ (`@shared/*`).
 */

import type { GameFilterDefinition } from "./filters";

export type { GameFilterDefinition } from "./filters";

import type { SharedGameDeckModule } from "./deck";

export type { SharedGameDeckModule } from "./deck";

export const GAME_IDS = ["uvs", "cyberpunk"] as const;

export type GameId = (typeof GAME_IDS)[number];

export const DEFAULT_GAME_ID: GameId = "uvs";

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && (GAME_IDS as readonly string[]).includes(value);
}

/** HSL triplets without `hsl()` (e.g. `"220 90% 56%"`), matching the CSS variable format. */
export interface GameThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

/** Product brand shown in the wordmark and page titles. */
export interface Brand {
  /** Wordmark parts: lead, accented middle, suffix (e.g. `["UVS", "DECKS", ".GG"]`). */
  wordmark: readonly [lead: string, accent: string, suffix: string];
  /** Plain-text brand, used for `<title>` and aria labels (e.g. `"UVSDECKS.GG"`). */
  title: string;
  /** Default meta description. */
  description: string;
}

/** Platform brand used on the apex host (`tcgdecks.gg`). */
export const PLATFORM_BRAND: Brand = {
  wordmark: ["TCG", "DECKS", ".GG"],
  title: "TCGDECKS.GG",
  description: "Deck building, card galleries, and community tools for trading card games. One account across every game.",
};

/** A format row `admin.seedFormats` creates for a game (mirrors the `formats` table). */
export interface GameFormatSeed {
  key: string;
  name: string;
  description?: string;
  isDefault: boolean;
  minDeckSize: number;
  maxDeckSize?: number;
  sideboardRule: string;
  defaultCopyLimit: number;
  requiresStartingCharacter: boolean;
  requiresIdentity: boolean;
}

/**
 * Game-specific data/logic shared by server and client. Intentionally minimal for now;
 * later phases add deck setup, validation, filters, import/export, etc.
 */
export interface SharedGameModule {
  id: GameId;
  /** Full name, e.g. "UniVersus". */
  displayName: string;
  /** Short label for compact UI, e.g. "UVS". */
  shortName: string;
  theme: GameThemeColors;
  /** Brand on this game's hosts (game subdomain + standalone). */
  brand: Brand;
  /** Gallery stat/zone filter descriptors (see `shared/games/filters.ts`). */
  filters: GameFilterDefinition;
  /** Deck setup, validation rules, card eligibility, list display, text import/export (see `shared/games/deck.ts`). */
  deck: SharedGameDeckModule;
  /** Formats seeded by `admin.seedFormats` (existing rows are kept; `standard` rules are re-synced). */
  defaultFormats: readonly GameFormatSeed[];
}
