import { describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

// `@convex-dev/auth/nextjs/server` imports `server-only`, which throws outside a Next server build.
mock.module("server-only", () => ({}));
const { signedInPageRedirect } = await import("../src/lib/agent-auth-middleware");

const request = (path: string) => new NextRequest(new URL(path, "http://localhost:8152"));

async function run(path: string, authed: boolean) {
  let asked = 0;
  const res = await signedInPageRedirect(request(path), async () => (asked++, authed));
  return { res, asked };
}

describe("signed-in page redirect (src/middleware.ts)", () => {
  test("still sends signed-in users from /sign-in and /sign-up to /home", async () => {
    for (const path of ["/sign-in", "/sign-up", "/sign-in?next=/decks"]) {
      const { res } = await run(path, true);
      expect(res?.status).toBe(307);
      expect(new URL(res!.headers.get("location")!).pathname).toBe("/home");
    }
  });

  test("leaves signed-out users on /sign-in and /sign-up", async () => {
    for (const path of ["/sign-in", "/sign-up"]) {
      expect((await run(path, false)).res).toBeUndefined();
    }
  });

  test("lets a signed-in visit to /agent-login load, so its fragment code isn't carried to /home", async () => {
    for (const authed of [true, false]) {
      const { res, asked } = await run("/agent-login", authed);
      expect(res).toBeUndefined();
      expect(asked).toBe(0);
    }
  });

  test("never redirects or checks auth on other pages", async () => {
    for (const path of ["/", "/home", "/decks", "/gallery", "/settings", "/api/auth", "/sign-in-help"]) {
      const { res, asked } = await run(path, true);
      expect(res).toBeUndefined();
      expect(asked).toBe(0);
    }
  });
});
