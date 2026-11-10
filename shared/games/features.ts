/**
 * Per-game feature manifest (`SharedGameModule.features`): which larger features/actions a game
 * ships. Pure data, readable from convex/ and src/. Gating sites are listed in
 * docs/multi-game.md ("Feature manifest").
 */

/** Deck list text import/export (deck details "Import/Export" tool). */
export interface GameDeckImportExportFeature {
  /** Format name in the panel labels ("Export to {formatLabel}", "Import from {formatLabel}"). */
  formatLabel: string;
  /** Import textarea placeholder (an example of the game's deck text format). */
  placeholder: string;
}

/** Curated community media: the shell media dock + the community hub video feed / creators links. */
export interface GameCommunityMediaFeature {
  /** Media dock toggle label in the left sidebar (e.g. "UniVersus"). */
  dockLabel: string;
  /** Community hub video section heading (e.g. "UniVersus Content"). */
  feedHeading: string;
  /** Fallback link when the video queue is empty. */
  youtubeChannelUrl: string;
  youtubeChannelLabel: string;
}

export interface GameFeatures {
  /** `/collection` route + nav item. */
  collection: boolean;
  /** Deck details right-sidebar "Stats" tool. */
  deckStats: boolean;
  /** Deck details right-sidebar "Simulator" (opening hand draws) tool. */
  drawSimulator: boolean;
  /** Deck details right-sidebar "Import/Export" tool; `false` hides it. */
  deckImportExport: false | GameDeckImportExportFeature;
  /** Deck format legality badge (server deck validation). */
  deckValidation: boolean;
  /** "Side" deck section (tabs, active-deck sidebar, move targets). */
  sideboard: boolean;
  /** "Reference" deck section (tabs, active-deck sidebar, move targets). */
  referenceSection: boolean;
  /** Community tier lists (`/community/tier-lists`, hub section, community right sidebar). */
  tierLists: boolean;
  /** Community rankings (tier lists "Rankings" tab, `/community/rankings`). Requires `tierLists`. */
  rankings: boolean;
  /** Creator program (`/community/creators`, community "Creators" tab and links). */
  creators: boolean;
  /** Curated media dock + community hub video feed; `false` hides both. */
  communityMedia: false | GameCommunityMediaFeature;
  /** Admin image → card draft OCR flow (set "Review" tab + route). */
  cardOcrDrafts: boolean;
}

export type GameFeatureKey = keyof GameFeatures;

export const GAME_FEATURE_KEYS = [
  "collection",
  "deckStats",
  "drawSimulator",
  "deckImportExport",
  "deckValidation",
  "sideboard",
  "referenceSection",
  "tierLists",
  "rankings",
  "creators",
  "communityMedia",
  "cardOcrDrafts",
] as const satisfies readonly GameFeatureKey[];

/** True when the feature is on (object-valued features count as on). */
export function isGameFeatureEnabled(features: GameFeatures, key: GameFeatureKey): boolean {
  if (key === "rankings" && !features.tierLists) return false;
  return features[key] !== false;
}

export type GameDeckSection = "main" | "side" | "reference";

/** Deck sections a game shows, in display order (`main` always). */
export function enabledDeckSections(features: GameFeatures): GameDeckSection[] {
  const sections: GameDeckSection[] = ["main"];
  if (features.sideboard) sections.push("side");
  if (features.referenceSection) sections.push("reference");
  return sections;
}
