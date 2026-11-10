/**
 * Cyberpunk TCG deck setup: the deck's Legends (ordered; `legendIds[0]` is the deck's preview art).
 * Pure TS (no Convex/React deps); card ids are generic so callers keep their `Id<"cards">` typing.
 */
import type { DeckSetup, DeckSetupPatch, DeckSetupSource } from "../deck";

/** Legends per deck (rules: exactly this many, all with different names). */
export const CYBERPUNK_LEGEND_COUNT = 3;

export interface CyberpunkDeckSetup<TCardId extends string = string> {
  game: "cyberpunk";
  legendIds: TCardId[];
}

/** Partial update: omitted/`undefined` keeps the Legends, `null` clears them, an array replaces them. */
export interface CyberpunkDeckSetupPatch<TCardId extends string = string> {
  game: "cyberpunk";
  legendIds?: TCardId[] | null;
}

function emptySetup<TCardId extends string>(): CyberpunkDeckSetup<TCardId> {
  return { game: "cyberpunk", legendIds: [] };
}

/**
 * Reads a deck's Cyberpunk setup. Returns a fresh object; another game's `setup` and the legacy
 * UVS top-level fields normalize to the empty setup (no Legends).
 */
export function normalizeCyberpunkSetup<TCardId extends string>(
  deck: DeckSetupSource<TCardId> | null | undefined,
): CyberpunkDeckSetup<TCardId> {
  const setup = deck?.setup;
  if (!setup || setup.game !== "cyberpunk") return emptySetup<TCardId>();
  return { game: "cyberpunk", legendIds: [...(setup.legendIds ?? [])] };
}

/**
 * Applies a setup patch. Throws on a patch for another game, more than `CYBERPUNK_LEGEND_COUNT`
 * Legends, or the same Legend twice (setups are writer-validated; name rules are deck validation).
 */
export function applyCyberpunkSetupPatch<TCardId extends string>(
  current: DeckSetup<TCardId>,
  patch: DeckSetupPatch<TCardId> | null | undefined,
): CyberpunkDeckSetup<TCardId> {
  if (patch === null) return emptySetup<TCardId>();
  const next = normalizeCyberpunkSetup<TCardId>({ setup: current });
  if (patch === undefined) return next;
  if (patch.game !== "cyberpunk") {
    throw new Error(`Cannot apply a "${patch.game}" setup patch to a Cyberpunk TCG deck`);
  }
  if (patch.legendIds === null) return emptySetup<TCardId>();
  if (patch.legendIds === undefined) return next;
  if (patch.legendIds.length > CYBERPUNK_LEGEND_COUNT) {
    throw new Error(`A Cyberpunk TCG deck has at most ${CYBERPUNK_LEGEND_COUNT} Legends`);
  }
  if (new Set(patch.legendIds).size !== patch.legendIds.length) {
    throw new Error("The same Legend cannot be added twice");
  }
  return { game: "cyberpunk", legendIds: [...patch.legendIds] };
}

/** Legend ids of a Cyberpunk setup/patch (empty for other games or `legendIds: null`). */
export function cyberpunkSetupCardIds<TCardId extends string>(
  setup: DeckSetup<TCardId> | DeckSetupPatch<TCardId> | null | undefined,
): TCardId[] {
  if (!setup || setup.game !== "cyberpunk") return [];
  return [...(setup.legendIds ?? [])];
}

/** Deck preview art: the first Legend. */
export function cyberpunkSetupPreviewCardId<TCardId extends string>(
  setup: DeckSetup<TCardId> | null | undefined,
): TCardId | undefined {
  return setup?.game === "cyberpunk" ? setup.legendIds[0] : undefined;
}
