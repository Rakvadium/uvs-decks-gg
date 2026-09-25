import { describe, expect, test } from "bun:test";
import {
  DEFAULT_ROOT_DOMAINS,
  GAME_SCOPED_PREFIXES,
  ROOT_DOMAINS,
  apexOrigin,
  gameOrigin,
  gameUrl,
  isAllowedHandoffOrigin,
  isGameScopedPath,
  isLocalRoot,
  legacyRedirectGame,
  parseRootDomains,
  resolveHost,
} from "@shared/hosts";

const ROOTS = DEFAULT_ROOT_DOMAINS;

describe("parseRootDomains / ROOT_DOMAINS", () => {
  test("defaults when unset or empty", () => {
    expect(parseRootDomains(undefined)).toEqual(["tcgdecks.gg", "tcgdecks.localhost"]);
    expect(parseRootDomains("")).toEqual(DEFAULT_ROOT_DOMAINS);
    expect(parseRootDomains(" , ,")).toEqual(DEFAULT_ROOT_DOMAINS);
  });

  test("override replaces defaults, normalizes, dedupes, drops invalid", () => {
    expect(parseRootDomains(" Example.COM , .foo.localhost., example.com, bad_domain, a..b, -x.com")).toEqual([
      "example.com",
      "foo.localhost",
    ]);
  });

  test("ROOT_DOMAINS follows NEXT_PUBLIC_ROOT_DOMAINS", () => {
    expect(ROOT_DOMAINS).toEqual(parseRootDomains(process.env.NEXT_PUBLIC_ROOT_DOMAINS));
  });
});

describe("resolveHost", () => {
  test("game hosts", () => {
    expect(resolveHost("uvs.tcgdecks.gg", ROOTS)).toEqual({ kind: "game", game: "uvs", root: "tcgdecks.gg", port: null });
    expect(resolveHost("UVS.TCGDecks.GG:443", ROOTS)).toEqual({ kind: "game", game: "uvs", root: "tcgdecks.gg", port: "443" });
    expect(resolveHost("cyberpunk.tcgdecks.gg", ROOTS)).toEqual({ kind: "game", game: "cyberpunk", root: "tcgdecks.gg", port: null });
    expect(resolveHost("uvs.tcgdecks.localhost:8090", ROOTS)).toEqual({
      kind: "game",
      game: "uvs",
      root: "tcgdecks.localhost",
      port: "8090",
    });
    expect(resolveHost("  uvs.tcgdecks.gg.  ", ROOTS)).toMatchObject({ kind: "game", game: "uvs" });
  });

  test("apex hosts", () => {
    for (const host of ["tcgdecks.gg", "www.tcgdecks.gg", "WWW.TCGDECKS.GG", "tcgdecks.localhost:8090", "www.tcgdecks.localhost:8090"]) {
      expect(resolveHost(host, ROOTS)).toMatchObject({ kind: "apex", game: null, unknownSubdomain: false });
    }
    expect(resolveHost("tcgdecks.localhost:8090", ROOTS)).toMatchObject({ root: "tcgdecks.localhost", port: "8090" });
  });

  test("unknown or nested subdomains resolve to apex with unknownSubdomain", () => {
    for (const host of ["foo.tcgdecks.gg", "pokemon.tcgdecks.gg", "a.uvs.tcgdecks.gg", "www.uvs.tcgdecks.gg", "foo.tcgdecks.localhost:8090"]) {
      expect(resolveHost(host, ROOTS)).toMatchObject({ kind: "apex", game: null, unknownSubdomain: true });
    }
  });

  test("everything else is standalone on the default game", () => {
    for (const host of [
      "localhost:8090",
      "localhost",
      "127.0.0.1:8090",
      "192.168.1.24:8090",
      "[::1]:8090",
      "::1",
      "[2001:db8::1]",
      "uvs-decks-gg-git-branch.vercel.app",
      "uvsdecks.gg",
      "www.uvsdecks.gg",
      "uvs.tcgdecks.gg.evil.com",
      "eviltcgdecks.gg",
      "uvs.eviltcgdecks.gg",
      "tcgdecks.gg.evil.com",
      "",
      "   ",
      "tcgdecks.gg:abc",
      ":8090",
    ]) {
      expect(resolveHost(host, ROOTS)).toMatchObject({ kind: "standalone", game: "uvs", root: null });
    }
    expect(resolveHost(null)).toMatchObject({ kind: "standalone" });
    expect(resolveHost(undefined)).toMatchObject({ kind: "standalone" });
    expect(resolveHost("localhost:8090", ROOTS).port).toBe("8090");
  });

  test("custom roots; longest root wins", () => {
    expect(resolveHost("uvs.example.com", ["example.com"])).toMatchObject({ kind: "game", root: "example.com" });
    expect(resolveHost("uvs.tcgdecks.gg", ["example.com"])).toMatchObject({ kind: "standalone" });
    expect(resolveHost("uvs.dev.example.com", ["example.com", "dev.example.com"])).toMatchObject({
      kind: "game",
      root: "dev.example.com",
    });
  });
});

describe("legacyRedirectGame", () => {
  test("maps legacy hosts", () => {
    expect(legacyRedirectGame("uvsdecks.gg")).toBe("uvs");
    expect(legacyRedirectGame("WWW.UVSDECKS.GG:443")).toBe("uvs");
    expect(legacyRedirectGame("uvs.tcgdecks.gg")).toBeNull();
    expect(legacyRedirectGame("evil.uvsdecks.gg")).toBeNull();
    expect(legacyRedirectGame("constructor")).toBeNull();
    expect(legacyRedirectGame("__proto__")).toBeNull();
    expect(legacyRedirectGame(null)).toBeNull();
  });
});

describe("isGameScopedPath", () => {
  test("matches prefixes on segment boundaries", () => {
    for (const prefix of GAME_SCOPED_PREFIXES) {
      expect(isGameScopedPath(prefix)).toBe(true);
      expect(isGameScopedPath(`${prefix}/x`)).toBe(true);
    }
    expect(isGameScopedPath("/decks/abc123")).toBe(true);
    expect(isGameScopedPath("/community/tier-lists/1")).toBe(true);
    expect(isGameScopedPath("/admin/sets/new")).toBe(true);
  });

  test("rejects global and look-alike paths", () => {
    for (const path of ["/", "", "/decksfoo", "/gallery-old", "/admin", "/admin/users", "/admin/setsx", "/settings", "/sign-in", "/api/x", "/uvs/decks", "decks", "/Decks"]) {
      expect(isGameScopedPath(path)).toBe(false);
    }
  });
});

describe("origins and URLs", () => {
  test("isLocalRoot", () => {
    expect(isLocalRoot("tcgdecks.localhost")).toBe(true);
    expect(isLocalRoot("localhost")).toBe(true);
    expect(isLocalRoot("tcgdecks.gg")).toBe(false);
    expect(isLocalRoot("localhost.evil.com")).toBe(false);
  });

  test("real roots are https without port", () => {
    expect(apexOrigin("tcgdecks.gg")).toBe("https://tcgdecks.gg");
    expect(apexOrigin("tcgdecks.gg", "http", 8090)).toBe("https://tcgdecks.gg");
    expect(gameOrigin("uvs", "tcgdecks.gg", "http:", "8443")).toBe("https://uvs.tcgdecks.gg");
  });

  test("local roots default to http and keep non-default port", () => {
    expect(apexOrigin("tcgdecks.localhost", undefined, 8090)).toBe("http://tcgdecks.localhost:8090");
    expect(gameOrigin("uvs", "tcgdecks.localhost", null, "8090")).toBe("http://uvs.tcgdecks.localhost:8090");
    expect(gameOrigin("uvs", "tcgdecks.localhost")).toBe("http://uvs.tcgdecks.localhost");
    expect(gameOrigin("uvs", "tcgdecks.localhost", "http", "80")).toBe("http://uvs.tcgdecks.localhost");
    expect(gameOrigin("uvs", "tcgdecks.localhost", "https:", "8443")).toBe("https://uvs.tcgdecks.localhost:8443");
    expect(gameOrigin("uvs", "tcgdecks.localhost", "javascript", "8090")).toBe("http://uvs.tcgdecks.localhost:8090");
  });

  test("gameUrl", () => {
    const prodGame = resolveHost("uvs.tcgdecks.gg", ROOTS);
    const prodApex = resolveHost("tcgdecks.gg", ROOTS);
    const devApex = resolveHost("tcgdecks.localhost:8090", ROOTS);
    const standalone = resolveHost("localhost:8090", ROOTS);
    expect(gameUrl("uvs", "/decks/1?x=1#y", prodApex)).toBe("https://uvs.tcgdecks.gg/decks/1?x=1#y");
    expect(gameUrl("uvs", "/gallery", prodGame)).toBe("https://uvs.tcgdecks.gg/gallery");
    expect(gameUrl("uvs", "gallery", prodGame)).toBe("https://uvs.tcgdecks.gg/gallery");
    expect(gameUrl("uvs", "", prodGame)).toBe("https://uvs.tcgdecks.gg/");
    expect(gameUrl("uvs", "@evil.com", prodGame)).toBe("https://uvs.tcgdecks.gg/@evil.com");
    expect(new URL(gameUrl("uvs", "//evil.com/x", prodGame)).host).toBe("uvs.tcgdecks.gg");
    expect(gameUrl("uvs", "/decks", devApex)).toBe("http://uvs.tcgdecks.localhost:8090/decks");
    expect(gameUrl("uvs", "/decks", standalone)).toBe("/decks");
  });
});

describe("isAllowedHandoffOrigin", () => {
  test("allows exact game origins", () => {
    expect(isAllowedHandoffOrigin("https://uvs.tcgdecks.gg", ROOTS)).toBe(true);
    expect(isAllowedHandoffOrigin("http://uvs.tcgdecks.localhost:8090", ROOTS)).toBe(true);
    expect(isAllowedHandoffOrigin("http://uvs.tcgdecks.localhost", ROOTS)).toBe(true);
    expect(isAllowedHandoffOrigin("https://uvs.tcgdecks.localhost:8443", ROOTS)).toBe(true);
    expect(isAllowedHandoffOrigin("https://uvs.example.com", ["example.com"])).toBe(true);
  });

  test("rejects apex, unknown subdomains, standalone and legacy hosts", () => {
    for (const origin of [
      "https://tcgdecks.gg",
      "https://www.tcgdecks.gg",
      "https://foo.tcgdecks.gg",
      "https://a.uvs.tcgdecks.gg",
      "http://tcgdecks.localhost:8090",
      "http://localhost:8090",
      "http://127.0.0.1:8090",
      "http://[::1]:8090",
      "https://uvsdecks.gg",
      "https://uvs.vercel.app",
    ]) {
      expect(isAllowedHandoffOrigin(origin, ROOTS)).toBe(false);
    }
  });

  test("rejects insecure or non-default-port prod origins", () => {
    expect(isAllowedHandoffOrigin("http://uvs.tcgdecks.gg", ROOTS)).toBe(false);
    expect(isAllowedHandoffOrigin("https://uvs.tcgdecks.gg:8443", ROOTS)).toBe(false);
    expect(isAllowedHandoffOrigin("https://uvs.tcgdecks.gg:443", ROOTS)).toBe(false); // non-canonical
    expect(isAllowedHandoffOrigin("ws://uvs.tcgdecks.gg", ROOTS)).toBe(false);
    expect(isAllowedHandoffOrigin("ftp://uvs.tcgdecks.localhost", ROOTS)).toBe(false);
  });

  test("rejects hostile and non-canonical inputs", () => {
    for (const origin of [
      "https://uvs.tcgdecks.gg.evil.com",
      "https://evil.com/?x=uvs.tcgdecks.gg",
      "https://evil.com#uvs.tcgdecks.gg",
      "https://uvs.tcgdecks.gg@evil.com",
      "https://user:pass@uvs.tcgdecks.gg",
      "https://user@uvs.tcgdecks.gg",
      "https://evil.com\\@uvs.tcgdecks.gg",
      "https://evil.com\\uvs.tcgdecks.gg",
      "javascript:alert(1)//uvs.tcgdecks.gg",
      "javascript:",
      "data:text/html,uvs.tcgdecks.gg",
      "https://uvs.tcgdecks.gg/",
      "https://uvs.tcgdecks.gg/path",
      "https://uvs.tcgdecks.gg?x=1",
      "https://uvs.tcgdecks.gg#x",
      "https://UVS.tcgdecks.gg",
      "HTTPS://uvs.tcgdecks.gg",
      " https://uvs.tcgdecks.gg",
      "https://uvs.tcgdecks.gg.",
      "//uvs.tcgdecks.gg",
      "uvs.tcgdecks.gg",
      "https://xn--uvs-.tcgdecks.gg",
      "https://uvs%2etcgdecks.gg",
      "http://uvs.tcgdecks.localhost.evil.com:8090",
      "https://uvs.tcgdecks.gg:0",
      "",
      "null",
    ]) {
      expect(isAllowedHandoffOrigin(origin, ROOTS)).toBe(false);
    }
    for (const value of [null, undefined, 42, {}, ["https://uvs.tcgdecks.gg"]]) {
      expect(isAllowedHandoffOrigin(value, ROOTS)).toBe(false);
    }
    expect(isAllowedHandoffOrigin(`https://uvs.tcgdecks.gg${"a".repeat(300)}`, ROOTS)).toBe(false);
  });
});
