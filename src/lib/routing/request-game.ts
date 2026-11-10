import "server-only";
import { headers } from "next/headers";
import { getSharedGameModule } from "@shared/games/registry";
import { PLATFORM_BRAND, type Brand, type GameId } from "@shared/games/types";
import { resolveHost, type HostInfo, type HostKind } from "@shared/hosts";
import { GAME_HEADER, HOST_KIND_HEADER, trustedRequestGame } from "./route-request";

export interface RequestGame {
  game: GameId;
  hostKind: HostKind;
  /** Resolved `Host` header (root/port for cross-host links). */
  host: HostInfo;
  /** `x-forwarded-proto` hint for `.localhost` origins (`gameOrigin`/`apexOrigin`). */
  protocol: string | null;
}

/**
 * Game + host kind for the current request, from the headers middleware sets
 * (`x-tcg-game`, `x-tcg-host-kind`) when they agree with the `Host` header
 * (`trustedRequestGame`); otherwise from resolving the `Host` header.
 * Apex requests report `DEFAULT_GAME_ID` with `hostKind: "apex"`.
 */
export async function getRequestGame(): Promise<RequestGame> {
  const h = await headers();
  const host = resolveHost(h.get("host"));
  const protocol = h.get("x-forwarded-proto");
  const { game, hostKind } = trustedRequestGame(host, h.get(GAME_HEADER), h.get(HOST_KIND_HEADER));
  return { game, hostKind, host, protocol };
}

/** Brand for the current host: the platform brand on the apex, else the game's brand. */
export async function getRequestBrand(): Promise<Brand> {
  const { game, hostKind } = await getRequestGame();
  return hostKind === "apex" ? PLATFORM_BRAND : getSharedGameModule(game).brand;
}
