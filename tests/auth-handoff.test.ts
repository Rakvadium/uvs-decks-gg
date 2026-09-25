import { describe, expect, test } from "bun:test";
import {
  buildHandoffCallbackUrl,
  buildHandoffStartUrl,
  buildSignedInHintCookie,
  bytesToBase64Url,
  checkHandoffCode,
  addPendingState,
  HANDOFF_STATE_TTL_MS,
  hasSignedInHint,
  hintCookieRoot,
  isAuthFlowPath,
  isSignedInHintAbsent,
  isValidHandoffCode,
  isValidHandoffState,
  parseHandoffReturnUrl,
  parsePendingStates,
  randomToken,
  readSignedInHintValue,
  sanitizeSameOriginPath,
  sha256Hex,
  takePendingState,
} from "@shared/auth-handoff";
import { DEFAULT_ROOT_DOMAINS } from "@shared/hosts";
import { apexOriginFor } from "@/lib/auth/handoff-client";
import { sanitizeAgentLoginNextPath } from "@/lib/agent-auth-shared";

const ROOTS = DEFAULT_ROOT_DOMAINS;

describe("sanitizeSameOriginPath", () => {
  test("keeps same-origin paths with query and hash", () => {
    expect(sanitizeSameOriginPath("/gallery")).toBe("/gallery");
    expect(sanitizeSameOriginPath("/decks/abc?x=1#y")).toBe("/decks/abc?x=1#y");
    expect(
      sanitizeSameOriginPath(
        "/auth/handoff?return=http%3A%2F%2Fuvs.tcgdecks.localhost%3A8090%2Fgallery&state=abc",
      ),
    ).toBe("/auth/handoff?return=http%3A%2F%2Fuvs.tcgdecks.localhost%3A8090%2Fgallery&state=abc");
  });

  test.each([
    "//evil.com",
    "/\\evil.com",
    "/\\/evil.com",
    "\\\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    " //evil.com",
    "/\tfoo",
    "/foo\nbar",
  ])("rejects %p", (value) => {
    expect(sanitizeSameOriginPath(value, "/fallback")).toBe("/fallback");
  });

  test("rejects non-strings", () => {
    expect(sanitizeSameOriginPath(undefined)).toBe("/");
    expect(sanitizeSameOriginPath(["/a"], "/x")).toBe("/x");
  });

  test("agent login next sanitizer allows handoff paths and blocks open redirects", () => {
    expect(sanitizeAgentLoginNextPath("/auth/handoff?return=x&state=y")).toBe(
      "/auth/handoff?return=x&state=y",
    );
    expect(sanitizeAgentLoginNextPath("/\\evil.com")).toBe("/home");
    expect(sanitizeAgentLoginNextPath("//evil.com")).toBe("/home");
  });
});

describe("parseHandoffReturnUrl", () => {
  test("accepts allowed game origins and extracts the path", () => {
    expect(parseHandoffReturnUrl("https://uvs.tcgdecks.gg/decks?x=1#frag", ROOTS)).toEqual({
      origin: "https://uvs.tcgdecks.gg",
      path: "/decks?x=1",
    });
    expect(parseHandoffReturnUrl("http://uvs.tcgdecks.localhost:8090/", ROOTS)).toEqual({
      origin: "http://uvs.tcgdecks.localhost:8090",
      path: "/",
    });
  });

  test.each([
    "https://tcgdecks.gg/",
    "https://evil.com/",
    "http://uvs.tcgdecks.gg/",
    "https://uvs.tcgdecks.gg:8443/",
    "https://user:pw@uvs.tcgdecks.gg/",
    "https://nope.tcgdecks.gg/",
    "https://uvs.tcgdecks.gg.evil.com/",
    "/relative",
    "",
    "javascript:alert(1)",
  ])("rejects %p", (value) => {
    expect(parseHandoffReturnUrl(value, ROOTS)).toBeNull();
  });
});

describe("URL builders", () => {
  test("start URL encodes return and flags", () => {
    const url = new URL(
      buildHandoffStartUrl("https://tcgdecks.gg", "https://uvs.tcgdecks.gg/decks?a=1&b=2", "s".repeat(32), {
        silent: true,
        flow: "signUp",
      }),
    );
    expect(url.origin).toBe("https://tcgdecks.gg");
    expect(url.pathname).toBe("/auth/handoff");
    expect(url.searchParams.get("return")).toBe("https://uvs.tcgdecks.gg/decks?a=1&b=2");
    expect(url.searchParams.get("state")).toBe("s".repeat(32));
    expect(url.searchParams.get("silent")).toBe("1");
    expect(url.searchParams.get("flow")).toBe("signUp");
  });

  test("start URL with empty apex is a host-relative path (agent login next)", () => {
    expect(buildHandoffStartUrl("", "http://uvs.tcgdecks.localhost:8090/", "a".repeat(16))).toBe(
      "/auth/handoff?return=http%3A%2F%2Fuvs.tcgdecks.localhost%3A8090%2F&state=aaaaaaaaaaaaaaaa",
    );
  });

  test("callback URL carries code/state and a sanitized next", () => {
    const url = new URL(
      buildHandoffCallbackUrl("https://uvs.tcgdecks.gg", {
        code: "c",
        state: "st",
        next: "//evil.com",
      }),
    );
    expect(url.origin).toBe("https://uvs.tcgdecks.gg");
    expect(url.pathname).toBe("/auth/callback");
    expect(url.searchParams.get("handoff_code")).toBe("c");
    expect(url.searchParams.has("code")).toBe(false);
    expect(url.searchParams.get("state")).toBe("st");
    expect(url.searchParams.get("next")).toBe("/");
    expect(
      new URL(
        buildHandoffCallbackUrl("https://uvs.tcgdecks.gg", {
          error: "login_required",
          next: "/gallery",
        }),
      ).searchParams.get("error"),
    ).toBe("login_required");
  });

  test("apexOriginFor", () => {
    expect(apexOriginFor({ host: "uvs.tcgdecks.gg", protocol: "https:" })).toBe("https://tcgdecks.gg");
    expect(apexOriginFor({ host: "uvs.tcgdecks.localhost:8090", protocol: "http:" })).toBe(
      "http://tcgdecks.localhost:8090",
    );
    expect(apexOriginFor({ host: "localhost:8090", protocol: "http:" })).toBeNull();
    expect(apexOriginFor({ host: "192.168.1.5:8090", protocol: "http:" })).toBeNull();
  });
});

describe("codes and state", () => {
  test("randomToken is 43-char base64url for 32 bytes and passes the code check", () => {
    const token = randomToken(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isValidHandoffCode(token)).toBe(true);
    expect(randomToken(32)).not.toBe(token);
    expect(isValidHandoffState(randomToken(24))).toBe(true);
  });

  test("validators reject junk", () => {
    expect(isValidHandoffCode("short")).toBe(false);
    expect(isValidHandoffCode(`${"a".repeat(42)}=`)).toBe(false);
    expect(isValidHandoffCode(123)).toBe(false);
    expect(isValidHandoffState("a".repeat(15))).toBe(false);
    expect(isValidHandoffState("a b".repeat(10))).toBe(false);
    expect(isValidHandoffState(null)).toBe(false);
  });

  test("bytesToBase64Url", () => {
    expect(bytesToBase64Url(new Uint8Array([251, 255, 191]))).toBe("-_-_");
  });

  test("sha256Hex", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  test("checkHandoffCode", () => {
    const origin = "https://uvs.tcgdecks.gg";
    const record = { origin, expiresAt: 1_000 };
    expect(checkHandoffCode(record, origin, 999)).toBe("ok");
    expect(checkHandoffCode(null, origin, 0)).toBe("not_found");
    expect(checkHandoffCode({ ...record, usedAt: 500 }, origin, 600)).toBe("used");
    expect(checkHandoffCode(record, origin, 1_000)).toBe("expired");
    expect(checkHandoffCode(record, "https://evil.tcgdecks.gg", 999)).toBe("origin_mismatch");
  });

  test("checkHandoffCode requires the minted state when present", () => {
    const origin = "https://uvs.tcgdecks.gg";
    const state = "abcdefghijklmnop";
    const record = { origin, state, expiresAt: 1_000 };
    expect(checkHandoffCode(record, origin, 999, state)).toBe("ok");
    expect(checkHandoffCode(record, origin, 999)).toBe("state_mismatch");
    expect(checkHandoffCode(record, origin, 999, null)).toBe("state_mismatch");
    expect(checkHandoffCode(record, origin, 999, "abcdefghijklmnoq")).toBe("state_mismatch");
    // Codes minted without state don't require one.
    expect(checkHandoffCode({ origin, expiresAt: 1_000 }, origin, 999, state)).toBe("ok");
  });
});

describe("signed-in hint cookie", () => {
  test("set/clear strings", () => {
    expect(buildSignedInHintCookie("tcgdecks.gg", { secure: true })).toBe(
      "tcgd_signed_in=1; Domain=.tcgdecks.gg; Path=/; SameSite=Lax; Max-Age=2592000; Secure",
    );
    expect(buildSignedInHintCookie("tcgdecks.localhost", { secure: false })).toBe(
      "tcgd_signed_in=1; Domain=.tcgdecks.localhost; Path=/; SameSite=Lax; Max-Age=2592000",
    );
    expect(buildSignedInHintCookie("tcgdecks.gg", { secure: false, clear: true })).toBe(
      "tcgd_signed_in=; Domain=.tcgdecks.gg; Path=/; SameSite=Lax; Max-Age=0; Secure",
    );
  });

  test("hintCookieRoot", () => {
    expect(hintCookieRoot("uvs.tcgdecks.gg", ROOTS)).toBe("tcgdecks.gg");
    expect(hintCookieRoot("tcgdecks.localhost:8090", ROOTS)).toBe("tcgdecks.localhost");
    expect(hintCookieRoot("localhost:8090", ROOTS)).toBeNull();
  });

  test("hasSignedInHint", () => {
    expect(hasSignedInHint("a=1; tcgd_signed_in=1; b=2")).toBe(true);
    expect(hasSignedInHint("tcgd_signed_in=")).toBe(false);
    expect(hasSignedInHint("xtcgd_signed_in=1")).toBe(false);
    expect(hasSignedInHint(undefined)).toBe(false);
    expect(hasSignedInHint("tcgd_signed_in=Ab_c-9")).toBe(true);
  });

  test("hint value", () => {
    expect(buildSignedInHintCookie("tcgdecks.localhost", { secure: false, value: "abc123" })).toBe(
      "tcgd_signed_in=abc123; Domain=.tcgdecks.localhost; Path=/; SameSite=Lax; Max-Age=2592000",
    );
    // Malformed values fall back to the legacy `1`.
    expect(buildSignedInHintCookie("tcgdecks.localhost", { secure: false, value: "a;b" })).toStartWith(
      "tcgd_signed_in=1;",
    );
    expect(readSignedInHintValue("a=1; tcgd_signed_in=xyz; b=2")).toBe("xyz");
    expect(readSignedInHintValue("tcgd_signed_in=1")).toBe("1");
    expect(readSignedInHintValue("tcgd_signed_in=")).toBeNull();
    expect(readSignedInHintValue("tcgd_signed_in=a%20b")).toBeNull();
    expect(readSignedInHintValue(null)).toBeNull();
  });

  test("signed-out marker", () => {
    expect(buildSignedInHintCookie("tcgdecks.localhost", { secure: false, signedOut: true })).toBe(
      "tcgd_signed_in=0; Domain=.tcgdecks.localhost; Path=/; SameSite=Lax; Max-Age=2592000",
    );
    expect(readSignedInHintValue("tcgd_signed_in=0")).toBeNull();
    expect(hasSignedInHint("tcgd_signed_in=0")).toBe(false);
    expect(isSignedInHintAbsent("tcgd_signed_in=0")).toBe(false);
    expect(isSignedInHintAbsent("tcgd_signed_in=abc")).toBe(false);
    expect(isSignedInHintAbsent("other=1")).toBe(true);
    expect(isSignedInHintAbsent("tcgd_signed_in=")).toBe(true);
  });
});

describe("pending handoff states", () => {
  const A = "a".repeat(32);
  const B = "b".repeat(32);
  const now = 1_000_000_000;

  test("a second state does not invalidate the first", () => {
    const raw = addPendingState(addPendingState(null, A, now), B, now + 1);
    const first = takePendingState(raw, A, now + 2);
    expect(first.matched).toBe(true);
    const second = takePendingState(first.raw, B, now + 3);
    expect(second.matched).toBe(true);
    expect(second.raw).toBeNull();
  });

  test("single use", () => {
    const raw = addPendingState(null, A, now);
    const first = takePendingState(raw, A, now);
    expect(first.matched).toBe(true);
    expect(takePendingState(first.raw, A, now).matched).toBe(false);
  });

  test("unknown, invalid and expired states don't match", () => {
    const raw = addPendingState(null, A, now);
    expect(takePendingState(raw, B, now).matched).toBe(false);
    expect(takePendingState(raw, B, now).raw).toBe(raw);
    expect(takePendingState(raw, "short", now).matched).toBe(false);
    expect(takePendingState(raw, null, now).matched).toBe(false);
    expect(takePendingState(raw, A, now + HANDOFF_STATE_TTL_MS).matched).toBe(false);
  });

  test("parse tolerates garbage and the legacy single-slot value", () => {
    expect(parsePendingStates("not json", now)).toEqual({});
    expect(parsePendingStates("[1,2]", now)).toEqual({});
    expect(parsePendingStates(JSON.stringify({ [A]: "x", bad: now }), now)).toEqual({});
    expect(parsePendingStates(A, now)).toEqual({ [A]: now });
  });

  test("keeps at most 8, newest first", () => {
    let raw: string | null = null;
    const states = Array.from({ length: 10 }, (_, i) => `${String(i).padStart(2, "0")}${"x".repeat(30)}`);
    states.forEach((state, i) => {
      raw = addPendingState(raw, state, now + i);
    });
    const kept = Object.keys(parsePendingStates(raw, now + 10));
    expect(kept).toHaveLength(8);
    expect(kept).not.toContain(states[0]);
    expect(kept).toContain(states[9]);
  });
});

describe("isAuthFlowPath", () => {
  test("auth pages", () => {
    for (const path of ["/auth/callback", "/auth/handoff", "/sign-in", "/sign-up", "/agent-login"]) {
      expect(isAuthFlowPath(path)).toBe(true);
    }
    for (const path of ["/", "/decks", "/sign-install", "/authors", "/settings"]) {
      expect(isAuthFlowPath(path)).toBe(false);
    }
  });
});
