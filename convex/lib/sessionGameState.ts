import type { Id } from "../_generated/dataModel";
import { DEFAULT_GAME_ID } from "../../shared/games/types";

/**
 * Per-game session UI state (`sessions.gameState[game]`, docs/multi-game.md).
 * Pure helpers (no Convex runtime) so they can be unit-tested.
 */

export type SessionGameState = {
  activeDeckId?: Id<"decks">;
  galleryFilters?: unknown;
  rightSidebarAction?: string;
};

type SessionLike = {
  activeDeckId?: Id<"decks">;
  galleryFilters?: unknown;
  rightSidebarAction?: string;
  gameState?: Record<string, SessionGameState>;
};

const GAME_STATE_KEYS = ["activeDeckId", "galleryFilters", "rightSidebarAction"] as const;

/** Copies only defined keys (Convex objects must not carry `undefined` values). */
function compact(state: SessionGameState): SessionGameState {
  const out: SessionGameState = {};
  for (const key of GAME_STATE_KEYS) {
    if (state[key] !== undefined) {
      (out as Record<string, unknown>)[key] = state[key];
    }
  }
  return out;
}

/**
 * The session's UI state for `game`. Once `gameState[game]` exists it is authoritative
 * (so clearing a value there does not resurrect the legacy one). Before that, the default game
 * falls back to the legacy top-level fields; other games start empty.
 */
export function resolveSessionGameState(
  session: SessionLike | null | undefined,
  game: string,
): SessionGameState {
  if (!session) return {};
  const entry = session.gameState?.[game];
  if (entry) return compact(entry);
  if (game !== DEFAULT_GAME_ID) return {};
  return compact({
    activeDeckId: session.activeDeckId,
    galleryFilters: session.galleryFilters,
    rightSidebarAction: session.rightSidebarAction,
  });
}

/**
 * The next `gameState` record after applying `patch` to `game` (other games are untouched).
 * `undefined` patch values mean "no change"; `null` clears a value. The first write for the
 * default game seeds the entry from the legacy top-level fields.
 */
export function nextSessionGameState(
  session: SessionLike | null | undefined,
  game: string,
  patch: { [K in keyof SessionGameState]?: SessionGameState[K] | null },
): Record<string, SessionGameState> {
  const current = resolveSessionGameState(session, game);
  const merged: Record<string, unknown> = { ...current };
  for (const key of GAME_STATE_KEYS) {
    const value = patch[key];
    if (value === undefined) continue;
    if (value === null) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }
  return {
    ...(session?.gameState ?? {}),
    [game]: compact(merged as SessionGameState),
  };
}
