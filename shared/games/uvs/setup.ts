/**
 * UVS deck setup: the starting character + selected identity symbol.
 * Replaces the legacy top-level `decks.startingCharacterId` / `decks.selectedIdentity` fields.
 * Pure TS (no Convex/React deps); card ids are generic so callers keep their `Id<"cards">` typing.
 */

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

/** Anything shaped like a deck row: new `setup` plus the deprecated legacy fields. */
export interface UvsDeckSetupSource<TCardId extends string = string> {
  setup?: UvsDeckSetup<TCardId> | null;
  /** @deprecated use `setup` */
  startingCharacterId?: TCardId | null;
  /** @deprecated use `setup` */
  selectedIdentity?: string | null;
}

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
 */
export function normalizeDeckSetup<TCardId extends string>(
  deck: UvsDeckSetupSource<TCardId> | null | undefined,
): UvsDeckSetup<TCardId> {
  const out = emptySetup<TCardId>();
  if (!deck) return out;
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
  current: UvsDeckSetup<TCardId>,
  patch: UvsDeckSetupPatch<TCardId> | null | undefined,
): UvsDeckSetup<TCardId> {
  if (patch === null) return emptySetup<TCardId>();
  const next = normalizeDeckSetup<TCardId>({ setup: current });
  if (patch === undefined) return next;
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
  setup: UvsDeckSetup<TCardId> | UvsDeckSetupPatch<TCardId> | null | undefined,
): TCardId[] {
  const id = setup?.startingCharacterId;
  return id !== undefined && id !== null ? [id] : [];
}

/**
 * Backfill transform for `migrations/migrateDeckSetup`: returns the patch that moves legacy
 * fields into `setup` (and unsets them), or `null` when the deck is already migrated or is not a
 * UVS deck (`game` missing means legacy UVS).
 */
export function deckSetupMigrationPatch<TCardId extends string>(
  deck: UvsDeckSetupSource<TCardId> & { game?: string | null },
): { setup: UvsDeckSetup<TCardId>; startingCharacterId: undefined; selectedIdentity: undefined } | null {
  if ((deck.game ?? DEFAULT_GAME_ID) !== "uvs") return null;
  const hasLegacy = deck.startingCharacterId !== undefined || deck.selectedIdentity !== undefined;
  if (deck.setup !== undefined && deck.setup !== null && !hasLegacy) return null;
  return {
    setup: normalizeDeckSetup(deck),
    startingCharacterId: undefined,
    selectedIdentity: undefined,
  };
}
