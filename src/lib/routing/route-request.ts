/**
 * Host/path → routing decision for middleware (see docs/multi-game.md "Hosts and routing").
 * Pure: no Next.js imports so it can be unit-tested directly.
 */
import { DEFAULT_GAME_ID, isGameId, type GameId } from "@shared/games/types";
import {
  apexOrigin,
  gameOrigin,
  isGameScopedPath,
  legacyRedirectGame,
  PRIMARY_ROOT_DOMAIN,
  resolveHost,
  ROOT_DOMAINS,
  type HostKind,
} from "@shared/hosts";

export const HOST_KIND_HEADER = "x-tcg-host-kind";
export const GAME_HEADER = "x-tcg-game";

/**
 * Internal path used for "notFound": it matches no page, so App Router renders the root
 * not-found UI with a 404 status.
 */
export const NOT_FOUND_REWRITE_PATH = "/__tcg-not-found";

export interface RouteRequestInput {
  /** `Host` header (may include a port). */
  host: string | null | undefined;
  /** URL pathname, starting with `/`. */
  pathname: string;
  /** URL search including the leading `?` (or ""). */
  search?: string;
  /** Request protocol (`"http:"`, `"https"`, …); only used for `.localhost` roots. */
  protocol?: string | null;
}

export type RouteDecision =
  | {
      type: "next";
      /** Headers to set on the forwarded request. */
      headers: Record<string, string>;
    }
  | {
      type: "rewrite";
      /** Host-relative path + search to rewrite to. */
      url: string;
      headers: Record<string, string>;
    }
  | {
      type: "redirect";
      /** Absolute URL. */
      url: string;
      status: 301 | 307;
    }
  | {
      type: "notFound";
      url: string;
      headers: Record<string, string>;
    };

/** Paths served on the apex host; everything else redirects to the default game host. */
const APEX_EXACT_PATHS = new Set(["/", "/sign-in", "/sign-up", "/agent-login"]);
const APEX_PREFIXES = ["/auth", "/api"];

export function isApexPath(pathname: string): boolean {
  if (APEX_EXACT_PATHS.has(pathname)) {
    return true;
  }
  return APEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function gameHeaders(hostKind: HostKind, game: GameId): Record<string, string> {
  return { [HOST_KIND_HEADER]: hostKind, [GAME_HEADER]: game };
}

function firstSegment(pathname: string): string {
  return pathname.split("/")[1] ?? "";
}

export function routeRequest(
  input: RouteRequestInput,
  roots: readonly string[] = ROOT_DOMAINS,
): RouteDecision {
  const pathname = input.pathname || "/";
  const search = input.search ?? "";

  const legacyGame = legacyRedirectGame(input.host);
  if (legacyGame) {
    const primaryRoot = roots[0] ?? PRIMARY_ROOT_DOMAIN;
    return {
      type: "redirect",
      url: `${gameOrigin(legacyGame, primaryRoot)}${pathname}${search}`,
      status: 301,
    };
  }

  const info = resolveHost(input.host, roots);

  if (info.kind === "apex") {
    if (info.unknownSubdomain) {
      return {
        type: "redirect",
        url: `${apexOrigin(info.root, input.protocol, info.port)}/`,
        status: 307,
      };
    }
    if (isApexPath(pathname)) {
      return { type: "next", headers: gameHeaders("apex", DEFAULT_GAME_ID) };
    }
    return {
      type: "redirect",
      url: `${gameOrigin(DEFAULT_GAME_ID, info.root, input.protocol, info.port)}${pathname}${search}`,
      status: 307,
    };
  }

  const headers = gameHeaders(info.kind, info.game);

  // `/{game}/...` only exists as a rewrite target; direct requests are 404.
  if (isGameId(firstSegment(pathname))) {
    return { type: "notFound", url: NOT_FOUND_REWRITE_PATH, headers };
  }

  if (isGameScopedPath(pathname)) {
    return { type: "rewrite", url: `/${info.game}${pathname}${search}`, headers };
  }

  return { type: "next", headers };
}
