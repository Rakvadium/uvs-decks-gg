import { SHARED_GAME_MODULES } from "@shared/games/registry";
import { GAME_IDS, type GameId, type SharedGameModule } from "@shared/games/types";
import { apexOrigin, gameUrl, type HostInfo } from "@shared/hosts";

/** Landing path when switching games. */
export const GAME_SWITCH_PATH = "/gallery";

export interface GameSwitcherEntry {
  id: GameId;
  displayName: string;
  shortName: string;
  /** Host-relative for the current game, absolute for other games. */
  href: string;
  current: boolean;
}

export interface GameSwitcherModel {
  current: SharedGameModule;
  games: GameSwitcherEntry[];
  /** Apex game picker (`tcgdecks.gg/`). */
  allGamesHref: string;
}

/**
 * Game switcher links for the current host. Only game hosts (`{game}.{root}`) can reach other
 * games and the apex, so standalone/apex hosts get `null` (the switcher is hidden there).
 */
export function buildGameSwitcherModel(
  host: HostInfo,
  currentGame: GameId,
  protocol: string | null = null,
  modules: Readonly<Record<GameId, SharedGameModule>> = SHARED_GAME_MODULES,
): GameSwitcherModel | null {
  if (host.kind !== "game") {
    return null;
  }
  return {
    current: modules[currentGame],
    games: GAME_IDS.map((id) => ({
      id,
      displayName: modules[id].displayName,
      shortName: modules[id].shortName,
      href: id === currentGame ? GAME_SWITCH_PATH : gameUrl(id, GAME_SWITCH_PATH, host, protocol),
      current: id === currentGame,
    })),
    allGamesHref: `${apexOrigin(host.root, protocol, host.port)}/`,
  };
}
