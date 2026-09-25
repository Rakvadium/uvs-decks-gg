import { describe, expect, test } from "bun:test";
import { DEFAULT_ROOT_DOMAINS, GAME_SCOPED_PREFIXES, resolveHost } from "@shared/hosts";
import {
  GAME_HEADER,
  HOST_KIND_HEADER,
  NOT_FOUND_REWRITE_PATH,
  AUTH_ENTRY_PATHS,
  authenticatedAuthEntryRedirect,
  isApexPath,
  routeRequest,
  trustedRequestGame,
  type RouteRequestInput,
} from "@/lib/routing/route-request";

const ROOTS = DEFAULT_ROOT_DOMAINS;

function route(input: RouteRequestInput) {
  return routeRequest(input, ROOTS);
}

describe("routeRequest: legacy hosts", () => {
  test("uvsdecks.gg → 301 to uvs.tcgdecks.gg with path and query", () => {
    expect(route({ host: "uvsdecks.gg", pathname: "/decks", search: "?x=1&y=2" })).toEqual({
      type: "redirect",
      url: "https://uvs.tcgdecks.gg/decks?x=1&y=2",
      status: 301,
    });
  });

  test("www.uvsdecks.gg root and deep paths", () => {
    expect(route({ host: "www.uvsdecks.gg", pathname: "/" })).toMatchObject({
      type: "redirect",
      url: "https://uvs.tcgdecks.gg/",
      status: 301,
    });
    expect(route({ host: "WWW.UVSDECKS.GG:443", pathname: "/decks/abc" })).toMatchObject({
      url: "https://uvs.tcgdecks.gg/decks/abc",
      status: 301,
    });
  });

  test("legacy redirect applies to every path, including settings and api", () => {
    expect(route({ host: "uvsdecks.gg", pathname: "/settings" })).toMatchObject({ status: 301 });
    expect(route({ host: "uvsdecks.gg", pathname: "/api/agent-auth" })).toMatchObject({
      status: 301,
    });
  });

  test("uses the first configured root as the canonical target", () => {
    expect(
      routeRequest({ host: "uvsdecks.gg", pathname: "/gallery" }, ["example.test"]),
    ).toMatchObject({ url: "https://uvs.example.test/gallery", status: 301 });
  });
});

describe("routeRequest: apex", () => {
  test.each([
    "/",
    "/sign-in",
    "/sign-up",
    "/agent-login",
    "/auth",
    "/auth/handoff",
    "/auth/callback",
    "/api/auth",
    "/api/agent-auth",
  ])("allows %s", (pathname) => {
    expect(route({ host: "tcgdecks.gg", pathname })).toEqual({
      type: "next",
      headers: { [HOST_KIND_HEADER]: "apex", [GAME_HEADER]: "uvs" },
    });
  });

  test("www apex is apex", () => {
    expect(route({ host: "www.tcgdecks.gg", pathname: "/sign-in" })).toMatchObject({
      type: "next",
    });
  });

  test("other paths 307 to the default game host with path and query", () => {
    expect(route({ host: "tcgdecks.gg", pathname: "/gallery", search: "?q=goku" })).toEqual({
      type: "redirect",
      url: "https://uvs.tcgdecks.gg/gallery?q=goku",
      status: 307,
    });
    expect(route({ host: "tcgdecks.gg", pathname: "/settings" })).toMatchObject({
      url: "https://uvs.tcgdecks.gg/settings",
      status: 307,
    });
    expect(route({ host: "tcgdecks.gg", pathname: "/tour" })).toMatchObject({
      url: "https://uvs.tcgdecks.gg/tour",
    });
  });

  test("prefix matches need a segment boundary", () => {
    expect(route({ host: "tcgdecks.gg", pathname: "/authors" })).toMatchObject({
      type: "redirect",
    });
    expect(route({ host: "tcgdecks.gg", pathname: "/apix" })).toMatchObject({ type: "redirect" });
    expect(route({ host: "tcgdecks.gg", pathname: "/sign-in/extra" })).toMatchObject({
      type: "redirect",
    });
  });

  test("dev apex keeps protocol and port", () => {
    expect(
      route({ host: "tcgdecks.localhost:8090", pathname: "/gallery", protocol: "http:" }),
    ).toEqual({
      type: "redirect",
      url: "http://uvs.tcgdecks.localhost:8090/gallery",
      status: 307,
    });
    expect(route({ host: "tcgdecks.localhost:8090", pathname: "/" })).toMatchObject({
      type: "next",
    });
  });

  test("isApexPath", () => {
    expect(isApexPath("/")).toBe(true);
    expect(isApexPath("/api")).toBe(true);
    expect(isApexPath("/decks")).toBe(false);
  });
});

describe("routeRequest: unknown subdomain", () => {
  test("redirects to the apex root (path dropped)", () => {
    expect(route({ host: "foo.tcgdecks.gg", pathname: "/decks", search: "?x=1" })).toEqual({
      type: "redirect",
      url: "https://tcgdecks.gg/",
      status: 307,
    });
  });

  test("deeper subdomains and dev ports", () => {
    expect(route({ host: "a.uvs.tcgdecks.gg", pathname: "/" })).toMatchObject({
      url: "https://tcgdecks.gg/",
    });
    expect(route({ host: "foo.tcgdecks.localhost:8090", pathname: "/gallery" })).toMatchObject({
      url: "http://tcgdecks.localhost:8090/",
    });
  });
});

describe("routeRequest: game host", () => {
  const gameHeaders = { [HOST_KIND_HEADER]: "game", [GAME_HEADER]: "uvs" };

  test.each(GAME_SCOPED_PREFIXES.map((prefix) => [prefix]))("rewrites %s", (prefix) => {
    expect(route({ host: "uvs.tcgdecks.gg", pathname: prefix })).toEqual({
      type: "rewrite",
      url: `/uvs${prefix}`,
      headers: gameHeaders,
    });
  });

  test("rewrites nested paths and keeps the query", () => {
    expect(
      route({ host: "uvs.tcgdecks.gg", pathname: "/decks/abc123", search: "?tab=stats" }),
    ).toEqual({ type: "rewrite", url: "/uvs/decks/abc123?tab=stats", headers: gameHeaders });
    expect(
      route({ host: "uvs.tcgdecks.gg", pathname: "/admin/sets/ABC/cards" }),
    ).toMatchObject({ url: "/uvs/admin/sets/ABC/cards" });
  });

  test("global routes pass through with headers", () => {
    for (const pathname of ["/", "/settings", "/teams/x", "/home", "/admin", "/admin/users", "/tour", "/sign-in"]) {
      expect(route({ host: "uvs.tcgdecks.gg", pathname })).toEqual({
        type: "next",
        headers: gameHeaders,
      });
    }
  });

  test("near-miss prefixes are not rewritten", () => {
    expect(route({ host: "uvs.tcgdecks.gg", pathname: "/galleryx" })).toMatchObject({
      type: "next",
    });
    expect(route({ host: "uvs.tcgdecks.gg", pathname: "/admin/setsx" })).toMatchObject({
      type: "next",
    });
  });

  test("api/auth is untouched (next)", () => {
    expect(route({ host: "uvs.tcgdecks.gg", pathname: "/api/auth" })).toEqual({
      type: "next",
      headers: gameHeaders,
    });
  });

  test("direct /{game}/... is 404", () => {
    expect(route({ host: "uvs.tcgdecks.gg", pathname: "/uvs/gallery" })).toEqual({
      type: "notFound",
      url: NOT_FOUND_REWRITE_PATH,
      headers: gameHeaders,
    });
    expect(route({ host: "uvs.tcgdecks.gg", pathname: "/uvs" })).toMatchObject({
      type: "notFound",
    });
  });

  test("dev game host with port", () => {
    expect(route({ host: "uvs.tcgdecks.localhost:8090", pathname: "/gallery" })).toEqual({
      type: "rewrite",
      url: "/uvs/gallery",
      headers: gameHeaders,
    });
  });
});

describe("routeRequest: standalone", () => {
  const standaloneHeaders = { [HOST_KIND_HEADER]: "standalone", [GAME_HEADER]: "uvs" };

  test.each(["localhost:8090", "192.168.1.20:8090", "my-app-git-branch.vercel.app", null, ""])(
    "%s rewrites game routes to the default game",
    (host) => {
      expect(route({ host, pathname: "/gallery", search: "?a=b" })).toEqual({
        type: "rewrite",
        url: "/uvs/gallery?a=b",
        headers: standaloneHeaders,
      });
    },
  );

  test("global routes and / pass through", () => {
    expect(route({ host: "localhost:8090", pathname: "/" })).toEqual({
      type: "next",
      headers: standaloneHeaders,
    });
    expect(route({ host: "localhost:8090", pathname: "/settings" })).toMatchObject({
      type: "next",
    });
  });

  test("direct /uvs/... is 404", () => {
    expect(route({ host: "localhost:8090", pathname: "/uvs/decks" })).toMatchObject({
      type: "notFound",
    });
  });

  test("non-game first segments are left alone", () => {
    expect(route({ host: "localhost:8090", pathname: "/uvsx/decks" })).toMatchObject({
      type: "next",
    });
  });
});

describe("authenticatedAuthEntryRedirect", () => {
  test("defaults to /home", () => {
    expect(authenticatedAuthEntryRedirect("")).toBe("/home");
    expect(authenticatedAuthEntryRedirect(undefined)).toBe("/home");
    expect(authenticatedAuthEntryRedirect("?foo=bar")).toBe("/home");
  });

  test("honors a same-origin next (e.g. the apex handoff)", () => {
    const next = "/auth/handoff?return=https%3A%2F%2Fuvs.tcgdecks.gg%2Fdecks&state=abcdefghijklmnop";
    expect(authenticatedAuthEntryRedirect(`?next=${encodeURIComponent(next)}`)).toBe(next);
    expect(authenticatedAuthEntryRedirect("?next=%2Fgallery")).toBe("/gallery");
  });

  test.each(["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)"])(
    "rejects next=%p",
    (next) => {
      expect(authenticatedAuthEntryRedirect(`?next=${encodeURIComponent(next)}`)).toBe("/home");
    },
  );

  test("auth entry pages are apex paths", () => {
    for (const path of AUTH_ENTRY_PATHS) {
      expect(isApexPath(path)).toBe(true);
    }
  });
});

describe("trustedRequestGame", () => {
  const game = resolveHost("uvs.tcgdecks.gg", ROOTS);
  const apex = resolveHost("tcgdecks.gg", ROOTS);
  const standalone = resolveHost("example.com", ROOTS);

  test("accepts headers consistent with the host", () => {
    expect(trustedRequestGame(game, "uvs", "game")).toEqual({ game: "uvs", hostKind: "game" });
    expect(trustedRequestGame(apex, "uvs", "apex")).toEqual({ game: "uvs", hostKind: "apex" });
    expect(trustedRequestGame(standalone, "uvs", "standalone")).toEqual({
      game: "uvs",
      hostKind: "standalone",
    });
  });

  test("falls back to the host on missing, invalid or inconsistent headers", () => {
    expect(trustedRequestGame(game, null, null)).toEqual({ game: "uvs", hostKind: "game" });
    expect(trustedRequestGame(game, "bogus", "game")).toEqual({ game: "uvs", hostKind: "game" });
    expect(trustedRequestGame(game, "uvs", "apex")).toEqual({ game: "uvs", hostKind: "game" });
    expect(trustedRequestGame(apex, "uvs", "game")).toEqual({ game: "uvs", hostKind: "apex" });
    expect(trustedRequestGame(standalone, "uvs", "game")).toEqual({
      game: "uvs",
      hostKind: "standalone",
    });
    expect(trustedRequestGame(standalone, "uvs", "bogus")).toEqual({
      game: "uvs",
      hostKind: "standalone",
    });
  });
});
