import { describe, expect, test } from "bun:test";
import { DEFAULT_ROOT_DOMAINS } from "@shared/hosts";
import { getSharedGameModule } from "@shared/games/registry";
import { authPageHref } from "@/components/auth/flow";
import { authPageTarget } from "@/lib/auth/auth-page-target";

const ROOTS = DEFAULT_ROOT_DOMAINS;

function handoffNext(returnUrl: string): string {
  return `/auth/handoff?${new URLSearchParams({ return: returnUrl, state: "abc" })}`;
}

describe("authPageHref", () => {
  test("carries the current page as next", () => {
    expect(authPageHref("signIn", "/decks?tab=mine")).toBe(
      `/sign-in?next=${encodeURIComponent("/decks?tab=mine")}`,
    );
    expect(authPageHref("signUp", "/teams")).toBe("/sign-up?next=%2Fteams");
  });

  test("drops next for home and auth pages", () => {
    expect(authPageHref("signIn", null)).toBe("/sign-in");
    expect(authPageHref("signIn", "/")).toBe("/sign-in");
    expect(authPageHref("signUp", "/sign-in?next=%2Fdecks")).toBe("/sign-up");
    expect(authPageHref("signIn", "/sign-up")).toBe("/sign-in");
  });
});

describe("authPageTarget", () => {
  test("names the game site a handoff came from", () => {
    const next = handoffNext("https://uvs.tcgdecks.gg/decks?x=1");
    expect(authPageTarget(next, ROOTS)).toEqual({
      nextPath: next,
      returnTo: {
        href: "https://uvs.tcgdecks.gg/decks?x=1",
        label: getSharedGameModule("uvs").brand.title,
      },
    });
  });

  test("keeps plain next paths without a return target", () => {
    expect(authPageTarget("/decks", ROOTS)).toEqual({ nextPath: "/decks", returnTo: null });
    expect(authPageTarget(undefined, ROOTS)).toEqual({ nextPath: null, returnTo: null });
  });

  test("rejects unsafe next and foreign return origins", () => {
    expect(authPageTarget("https://evil.example/x", ROOTS)).toEqual({ nextPath: null, returnTo: null });
    const foreign = handoffNext("https://evil.example/decks");
    expect(authPageTarget(foreign, ROOTS).returnTo).toBeNull();
    const apex = handoffNext("https://tcgdecks.gg/");
    expect(authPageTarget(apex, ROOTS).returnTo).toBeNull();
  });
});
