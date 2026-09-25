import type { HostKind } from "../hosts";
import {
  DEFAULT_GAME_ID,
  PLATFORM_BRAND,
  isGameId,
  type Brand,
  type GameId,
  type SharedGameModule,
} from "./types";
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

/** Brand for a host: the platform brand on the apex, else the game's own brand. */
export function getHostBrand(hostKind: HostKind, game: GameId): Brand {
  return hostKind === "apex" ? PLATFORM_BRAND : getSharedGameModule(game).brand;
}
