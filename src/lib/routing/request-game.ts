import "server-only";
import { headers } from "next/headers";
import { DEFAULT_GAME_ID, isGameId, type GameId } from "@shared/games/types";
import { resolveHost, type HostKind } from "@shared/hosts";
import { GAME_HEADER, HOST_KIND_HEADER } from "./route-request";

const HOST_KINDS: readonly HostKind[] = ["game", "apex", "standalone"];

/**
 * Game + host kind for the current request, from the headers middleware sets
 * (`x-tcg-game`, `x-tcg-host-kind`). Falls back to resolving the `Host` header.
 * Apex requests report `DEFAULT_GAME_ID` with `hostKind: "apex"`.
 */
export async function getRequestGame(): Promise<{ game: GameId; hostKind: HostKind }> {
  const h = await headers();
  const game = h.get(GAME_HEADER);
  const hostKind = h.get(HOST_KIND_HEADER);
  if (isGameId(game) && HOST_KINDS.includes(hostKind as HostKind)) {
    return { game, hostKind: hostKind as HostKind };
  }
  const info = resolveHost(h.get("host"));
  return { game: info.game ?? DEFAULT_GAME_ID, hostKind: info.kind };
}
