/**
 * Host → game resolution and cross-host URL builders (see docs/multi-game.md "Hosts and routing").
 * Pure TS: used by middleware, src/ (`@shared/hosts`) and convex/ (relative import).
 */
import { DEFAULT_GAME_ID, isGameId, type GameId } from "./games/types";

export const DEFAULT_ROOT_DOMAINS = ["tcgdecks.gg", "tcgdecks.localhost"] as const;

/** Legacy hosts that 301 to `https://{game}.{primary root}` with the same path. */
export const LEGACY_REDIRECT_HOSTS: Readonly<Record<string, GameId>> = {
  "uvsdecks.gg": "uvs",
  "www.uvsdecks.gg": "uvs",
};

/** User-visible path prefixes that middleware rewrites to `/{game}/...`. */
export const GAME_SCOPED_PREFIXES = [
  "/gallery",
  "/decks",
  "/collection",
  "/community",
  "/admin/sets",
  "/admin/cards",
  "/admin/formats",
  "/admin/import",
] as const;

export type HostKind = "game" | "apex" | "standalone";

export type HostInfo =
  | { kind: "game"; game: GameId; root: string; port: string | null }
  | {
      kind: "apex";
      game: null;
      root: string;
      port: string | null;
      /** `foo.{root}` where `foo` is not a GameId (or deeper subdomains): treat as apex / redirect there. */
      unknownSubdomain: boolean;
    }
  | { kind: "standalone"; game: GameId; root: null; port: string | null };

type Protocol = "http" | "https";

const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function normalizeDomain(value: string): string | null {
  const domain = value.trim().toLowerCase().replace(/^\.+/, "").replace(/\.+$/, "");
  if (!domain || !domain.split(".").every((label) => DOMAIN_LABEL.test(label))) {
    return null;
  }
  return domain;
}

/** Parse a comma-separated root domain list; returns the defaults when empty/invalid. */
export function parseRootDomains(raw: string | null | undefined): readonly string[] {
  const parsed = (raw ?? "")
    .split(",")
    .map(normalizeDomain)
    .filter((domain): domain is string => domain !== null);
  const unique = Array.from(new Set(parsed));
  return unique.length > 0 ? unique : DEFAULT_ROOT_DOMAINS;
}

/**
 * Configured root domains. `NEXT_PUBLIC_ROOT_DOMAINS` (comma list) replaces the defaults.
 * Next inlines the literal `process.env.NEXT_PUBLIC_ROOT_DOMAINS`; Convex needs it set as a
 * deployment env var for the override to apply server-side.
 */
export const ROOT_DOMAINS: readonly string[] = parseRootDomains(
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_ROOT_DOMAINS : undefined,
);

/** The root used for canonical links (legacy redirects etc.). */
export const PRIMARY_ROOT_DOMAIN: string = ROOT_DOMAINS[0];

export function isLocalRoot(root: string): boolean {
  return root === "localhost" || root.endsWith(".localhost");
}

function splitHostHeader(host: string): { hostname: string; port: string | null } | null {
  const trimmed = host.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("[")) {
    // Bracketed IPv6 literal – never a root/game host.
    return null;
  }
  const colon = trimmed.lastIndexOf(":");
  let hostname = trimmed;
  let port: string | null = null;
  if (colon !== -1) {
    const maybePort = trimmed.slice(colon + 1);
    if (!/^\d{1,5}$/.test(maybePort)) {
      return null;
    }
    hostname = trimmed.slice(0, colon);
    port = maybePort;
  }
  if (hostname.includes(":")) {
    // Unbracketed IPv6.
    return null;
  }
  hostname = hostname.replace(/\.$/, "");
  return hostname ? { hostname, port } : null;
}

function standalone(port: string | null): HostInfo {
  return { kind: "standalone", game: DEFAULT_GAME_ID, root: null, port };
}

/** Resolve a `Host` header value (may include port) to its host kind and game. */
export function resolveHost(
  host: string | null | undefined,
  roots: readonly string[] = ROOT_DOMAINS,
): HostInfo {
  const parts = splitHostHeader(host ?? "");
  if (!parts) {
    return standalone(null);
  }
  const { hostname, port } = parts;
  // Longest root first so nested roots (e.g. "a.b" and "b") resolve to the most specific one.
  const sortedRoots = [...roots].sort((a, b) => b.length - a.length);
  for (const root of sortedRoots) {
    if (hostname === root || hostname === `www.${root}`) {
      return { kind: "apex", game: null, root, port, unknownSubdomain: false };
    }
    if (hostname.endsWith(`.${root}`)) {
      const sub = hostname.slice(0, -(root.length + 1));
      if (isGameId(sub)) {
        return { kind: "game", game: sub, root, port };
      }
      return { kind: "apex", game: null, root, port, unknownSubdomain: true };
    }
  }
  return standalone(port);
}

/** Game for a legacy host (e.g. `uvsdecks.gg` → `uvs`), or null. */
export function legacyRedirectGame(host: string | null | undefined): GameId | null {
  const parts = splitHostHeader(host ?? "");
  if (!parts) {
    return null;
  }
  return Object.hasOwn(LEGACY_REDIRECT_HOSTS, parts.hostname)
    ? LEGACY_REDIRECT_HOSTS[parts.hostname]
    : null;
}

export function isGameScopedPath(pathname: string): boolean {
  return GAME_SCOPED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function normalizeProtocol(hint: string | null | undefined): Protocol | null {
  const value = (hint ?? "").trim().toLowerCase().replace(/:$/, "");
  return value === "http" || value === "https" ? value : null;
}

function originFor(
  hostname: string,
  root: string,
  protocolHint?: string | null,
  port?: string | number | null,
): string {
  if (!isLocalRoot(root)) {
    // Real roots are always https on the default port.
    return `https://${hostname}`;
  }
  const protocol = normalizeProtocol(protocolHint) ?? "http";
  const portText = port === null || port === undefined || port === "" ? "" : String(port);
  const defaultPort = protocol === "https" ? "443" : "80";
  return portText && portText !== defaultPort
    ? `${protocol}://${hostname}:${portText}`
    : `${protocol}://${hostname}`;
}

/** `https://{root}`; `.localhost` roots use http (unless hinted) and keep `port`. */
export function apexOrigin(
  root: string,
  protocolHint?: string | null,
  port?: string | number | null,
): string {
  return originFor(root, root, protocolHint, port);
}

/** `https://{game}.{root}`; `.localhost` roots use http (unless hinted) and keep `port`. */
export function gameOrigin(
  game: GameId,
  root: string,
  protocolHint?: string | null,
  port?: string | number | null,
): string {
  return originFor(`${game}.${root}`, root, protocolHint, port);
}

function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * URL for `path` on `game`'s host, relative to the current host.
 * Standalone hosts serve a single game, so the path stays host-relative there.
 */
export function gameUrl(
  game: GameId,
  path: string,
  current: HostInfo,
  protocolHint?: string | null,
): string {
  const normalizedPath = normalizePath(path);
  if (current.kind === "standalone") {
    return normalizedPath;
  }
  return `${gameOrigin(game, current.root, protocolHint, current.port)}${normalizedPath}`;
}

/**
 * Whether `origin` may receive an auth handoff code: exactly `https://{game}.{root}` for real
 * roots, or `http(s)://{game}.{root}[:port]` for `.localhost` roots. Must be a bare origin
 * (no path, query, userinfo, trailing slash) in canonical lowercase form.
 */
export function isAllowedHandoffOrigin(
  origin: unknown,
  roots: readonly string[] = ROOT_DOMAINS,
): boolean {
  if (typeof origin !== "string" || origin.length === 0 || origin.length > 255) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.origin === "null" || url.origin !== origin) {
    return false;
  }
  if (url.username || url.password || url.hostname.endsWith(".")) {
    return false;
  }
  const info = resolveHost(url.host, roots);
  if (info.kind !== "game") {
    return false;
  }
  if (isLocalRoot(info.root)) {
    return url.protocol === "http:" || url.protocol === "https:";
  }
  return url.protocol === "https:" && url.port === "";
}
