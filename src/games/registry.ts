import { DEFAULT_GAME_ID, isGameId, type GameId } from "@shared/games/types";
import type { ClientGameModule } from "./types";
import { UVS_CLIENT_GAME_MODULE } from "./uvs";

export const CLIENT_GAME_MODULES: Record<GameId, ClientGameModule> = {
  uvs: UVS_CLIENT_GAME_MODULE,
};

export function getClientGameModule(id: GameId): ClientGameModule {
  return CLIENT_GAME_MODULES[id];
}

/** Lenient lookup for untrusted input (headers, params); falls back to the default game. */
export function getClientGameModuleOrDefault(id: string | null | undefined): ClientGameModule {
  return CLIENT_GAME_MODULES[isGameId(id) ? id : DEFAULT_GAME_ID];
}
