/**
 * Game identity + the shared (runtime-agnostic) game module contract.
 * Pure TS: safe to import from convex/ (relative path) and src/ (`@shared/*`).
 */

import type { GameFilterDefinition } from "./filters";

export type { GameFilterDefinition } from "./filters";

import type { SharedGameDeckModule } from "./deck";

export type { SharedGameDeckModule } from "./deck";

export const GAME_IDS = ["uvs"] as const;

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
  /** Gallery stat/zone filter descriptors (see `shared/games/filters.ts`). */
  filters: GameFilterDefinition;
  /** Deck setup, validation rules, card eligibility, list display, text import/export (see `shared/games/deck.ts`). */
  deck: SharedGameDeckModule;
}
