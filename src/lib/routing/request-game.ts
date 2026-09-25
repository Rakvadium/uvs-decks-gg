import "server-only";
import { headers } from "next/headers";
import { DEFAULT_GAME_ID, isGameId, type GameId } from "@shared/games/types";
import { resolveHost, type HostInfo, type HostKind } from "@shared/hosts";
import { GAME_HEADER, HOST_KIND_HEADER } from "./route-request";

const HOST_KINDS: readonly HostKind[] = ["game", "apex", "standalone"];

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
 * (`x-tcg-game`, `x-tcg-host-kind`). Falls back to resolving the `Host` header.
 * Apex requests report `DEFAULT_GAME_ID` with `hostKind: "apex"`.
 */
export async function getRequestGame(): Promise<RequestGame> {
  const h = await headers();
  const host = resolveHost(h.get("host"));
  const protocol = h.get("x-forwarded-proto");
  const game = h.get(GAME_HEADER);
  const hostKind = h.get(HOST_KIND_HEADER);
  if (isGameId(game) && HOST_KINDS.includes(hostKind as HostKind)) {
    return { game, hostKind: hostKind as HostKind, host, protocol };
  }
  return { game: host.game ?? DEFAULT_GAME_ID, hostKind: host.kind, host, protocol };
}
