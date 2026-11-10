/**
 * UVS deck setup: the starting character + selected identity symbol.
 * Replaces the legacy top-level `decks.startingCharacterId` / `decks.selectedIdentity` fields.
 * Pure TS (no Convex/React deps); card ids are generic so callers keep their `Id<"cards">` typing.
 */

import type { DeckSetup, DeckSetupPatch, DeckSetupSource } from "../deck";
import { DEFAULT_GAME_ID } from "../types";

export interface UvsDeckSetup<TCardId extends string = string> {
  game: "uvs";
  startingCharacterId?: TCardId;
  selectedIdentity?: string;
}

/**
 * Partial update for a UVS deck setup. Per field: omitted/`undefined` keeps the current value,
 * `null` clears it, anything else (including `""`) sets it.
 */
export interface UvsDeckSetupPatch<TCardId extends string = string> {
  game: "uvs";
  startingCharacterId?: TCardId | null;
  selectedIdentity?: string | null;
}

/** Anything shaped like a deck row: new `setup` (any game) plus the deprecated legacy fields. */
export type UvsDeckSetupSource<TCardId extends string = string> = DeckSetupSource<TCardId>;

/** Legacy mutation args still accepted by `decks.create` / `decks.update` for one release. */
export interface UvsLegacyDeckSetupArgs<TCardId extends string = string> {
  startingCharacterId?: TCardId | null;
  selectedIdentity?: string | null;
}

function emptySetup<TCardId extends string>(): UvsDeckSetup<TCardId> {
  return { game: "uvs" };
}

/**
 * The single read path for deck setup: prefers `deck.setup` (as a whole) and falls back to the
 * legacy top-level fields. Always returns a fresh object without `undefined`/`null` keys.
 * Another game's `setup` normalizes to the empty UVS setup.
 */
export function normalizeDeckSetup<TCardId extends string>(
  deck: UvsDeckSetupSource<TCardId> | null | undefined,
): UvsDeckSetup<TCardId> {
  const out = emptySetup<TCardId>();
  if (!deck) return out;
  if (deck.setup && deck.setup.game !== "uvs") return out;
  const source = deck.setup ?? deck;
  if (source.startingCharacterId !== undefined && source.startingCharacterId !== null) {
    out.startingCharacterId = source.startingCharacterId;
  }
  if (source.selectedIdentity !== undefined && source.selectedIdentity !== null) {
    out.selectedIdentity = source.selectedIdentity;
  }
  return out;
}

/**
 * Applies a partial setup patch (see `UvsDeckSetupPatch`). `patch === null` clears every field;
 * `patch === undefined` returns a copy of `current`.
 */
export function applyDeckSetupPatch<TCardId extends string>(
  current: DeckSetup<TCardId>,
  patch: DeckSetupPatch<TCardId> | null | undefined,
): UvsDeckSetup<TCardId> {
  if (patch === null) return emptySetup<TCardId>();
  const next = normalizeDeckSetup<TCardId>({ setup: current });
  if (patch === undefined) return next;
  if (patch.game !== "uvs") {
    throw new Error(`Cannot apply a "${patch.game}" setup patch to a UniVersus deck`);
  }
  if (patch.startingCharacterId === null) {
    delete next.startingCharacterId;
  } else if (patch.startingCharacterId !== undefined) {
    next.startingCharacterId = patch.startingCharacterId;
  }
  if (patch.selectedIdentity === null) {
    delete next.selectedIdentity;
  } else if (patch.selectedIdentity !== undefined) {
    next.selectedIdentity = patch.selectedIdentity;
  }
  return next;
}

/**
 * Folds the deprecated top-level mutation args into a setup patch. Explicit `setup` fields win
 * over legacy args; `setup: null` clears everything except fields a legacy arg sets.
 * Returns `undefined` when nothing setup-related was sent (no write).
 */
export function mergeLegacyDeckSetupArgs<TCardId extends string>(
  setup: UvsDeckSetupPatch<TCardId> | null | undefined,
  legacy: UvsLegacyDeckSetupArgs<TCardId>,
): UvsDeckSetupPatch<TCardId> | null | undefined {
  const hasLegacy = legacy.startingCharacterId !== undefined || legacy.selectedIdentity !== undefined;
  if (!hasLegacy) return setup;
  if (setup === null) {
    return {
      game: "uvs",
      startingCharacterId: legacy.startingCharacterId !== undefined ? legacy.startingCharacterId : null,
      selectedIdentity: legacy.selectedIdentity !== undefined ? legacy.selectedIdentity : null,
    };
  }
  return {
    game: "uvs",
    startingCharacterId:
      setup?.startingCharacterId !== undefined ? setup.startingCharacterId : legacy.startingCharacterId,
    selectedIdentity: setup?.selectedIdentity !== undefined ? setup.selectedIdentity : legacy.selectedIdentity,
  };
}

/** Card ids referenced by a setup or setup patch (e.g. to reject back faces). */
export function deckSetupCardIds<TCardId extends string>(
  setup: DeckSetup<TCardId> | DeckSetupPatch<TCardId> | null | undefined,
): TCardId[] {
  if (!setup || setup.game !== "uvs") return [];
  const id = setup.startingCharacterId;
  return id !== undefined && id !== null ? [id] : [];
}

/** Deck preview art: the starting character. */
export function uvsSetupPreviewCardId<TCardId extends string>(
  setup: DeckSetup<TCardId> | null | undefined,
): TCardId | undefined {
  return setup?.game === "uvs" ? setup.startingCharacterId : undefined;
}

/**
 * UVS fields of any game's setup (empty for other games). For UVS-only UI that still renders on
 * every game until the per-game setup UI lands.
 */
export function uvsSetupFields<TCardId extends string>(
  setup: DeckSetup<TCardId> | null | undefined,
): { startingCharacterId?: TCardId; selectedIdentity?: string } {
  return setup?.game === "uvs" ? setup : {};
}

/**
 * Legacy top-level fields mirrored from a setup. The live `master` frontend still reads
 * `decks.startingCharacterId` / `decks.selectedIdentity`, so every UVS deck write keeps them in
 * sync with `setup` (both keys always present so a patch also clears them). Non-UVS setups clear
 * them. Remove once no deployed frontend reads the legacy fields.
 */
export function legacyUvsSetupFields<TCardId extends string>(
  setup: DeckSetup<TCardId> | null | undefined,
): { startingCharacterId: TCardId | undefined; selectedIdentity: string | undefined } {
  if (setup?.game !== "uvs") return { startingCharacterId: undefined, selectedIdentity: undefined };
  return { startingCharacterId: setup.startingCharacterId, selectedIdentity: setup.selectedIdentity };
}

/**
 * Backfill transform for `migrations/migrateDeckSetup`: returns the patch that writes `setup`
 * and keeps the legacy fields mirrored from it, or `null` when the deck already has both in sync
 * or is not a UVS deck (`game` missing means legacy UVS).
 */
export function deckSetupMigrationPatch<TCardId extends string>(
  deck: UvsDeckSetupSource<TCardId> & { game?: string | null },
): { setup: UvsDeckSetup<TCardId>; startingCharacterId: TCardId | undefined; selectedIdentity: string | undefined } | null {
  if ((deck.game ?? DEFAULT_GAME_ID) !== "uvs") return null;
  const setup = normalizeDeckSetup(deck);
  const legacy = legacyUvsSetupFields(setup);
  const inSync =
    deck.setup !== undefined &&
    deck.setup !== null &&
    deck.startingCharacterId === legacy.startingCharacterId &&
    deck.selectedIdentity === legacy.selectedIdentity;
  if (inSync) return null;
  return { setup, ...legacy };
}
