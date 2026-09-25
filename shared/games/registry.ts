import { DEFAULT_GAME_ID, isGameId, type GameId, type SharedGameModule } from "./types";
import { UVS_SHARED_GAME_MODULE } from "./uvs";

export const SHARED_GAME_MODULES: Record<GameId, SharedGameModule> = {
  uvs: UVS_SHARED_GAME_MODULE,
};

export function getSharedGameModule(id: GameId): SharedGameModule {
  return SHARED_GAME_MODULES[id];
}

/** Lenient lookup for untrusted input (headers, params); falls back to the default game. */
export function getSharedGameModuleOrDefault(id: string | null | undefined): SharedGameModule {
  return SHARED_GAME_MODULES[isGameId(id) ? id : DEFAULT_GAME_ID];
}
