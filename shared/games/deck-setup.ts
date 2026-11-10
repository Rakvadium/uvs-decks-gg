/**
 * Game-dispatching deck setup helpers (pick the module from `setup.game` / the deck's game).
 * Pure TS: safe to import from convex/ (relative path) and src/ (`@shared/*`).
 */
import type { DeckSetup, DeckSetupPatch } from "./deck";
import { getSharedGameModule } from "./registry";
import type { GameId } from "./types";
import { mergeLegacyDeckSetupArgs, type UvsLegacyDeckSetupArgs } from "./uvs/setup";

/** Deck preview card for any game's setup (UVS: starting character; Cyberpunk: first Legend). */
export function deckSetupPreviewCardId<TCardId extends string>(
  setup: DeckSetup<TCardId> | null | undefined,
): TCardId | undefined {
  if (!setup) return undefined;
  return getSharedGameModule(setup.game).deck.setupPreviewCardId(setup);
}

/** Card ids referenced by any game's setup / patch. */
export function deckSetupCardIdsForAnyGame<TCardId extends string>(
  setup: DeckSetup<TCardId> | DeckSetupPatch<TCardId> | null | undefined,
): TCardId[] {
  if (!setup) return [];
  return getSharedGameModule(setup.game).deck.setupCardIds(setup);
}

/**
 * Resolves `decks.create` / `decks.update` setup args for a deck of `game`:
 * - a `setup` tagged with another game throws,
 * - UVS folds the deprecated `startingCharacterId` / `selectedIdentity` args in
 *   (`mergeLegacyDeckSetupArgs`),
 * - other games reject those legacy args.
 * Returns `undefined` when nothing setup-related was sent.
 */
export function resolveDeckSetupPatchArgs<TCardId extends string>(
  game: GameId,
  setup: DeckSetupPatch<TCardId> | null | undefined,
  legacy: UvsLegacyDeckSetupArgs<TCardId>,
): DeckSetupPatch<TCardId> | null | undefined {
  if (setup && setup.game !== game) {
    throw new Error(`Deck setup is for "${setup.game}" but the deck is a "${game}" deck`);
  }
  if (setup === undefined || setup === null || setup.game === "uvs") {
    if (game === "uvs") return mergeLegacyDeckSetupArgs(setup, legacy);
  }
  if (legacy.startingCharacterId !== undefined || legacy.selectedIdentity !== undefined) {
    throw new Error(`startingCharacterId / selectedIdentity are UniVersus-only; send \`setup\` for "${game}" decks`);
  }
  return setup;
}
