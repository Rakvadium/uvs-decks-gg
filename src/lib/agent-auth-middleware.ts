import { createRouteMatcher, nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";
import type { NextRequest } from "next/server";

/**
 * Pages a signed-in visitor is sent away from (to `/home`). `/agent-login` is deliberately not
 * one: browsers keep the URL fragment across a redirect, so `/agent-login#code=…` would land on
 * `/home#code=…` with the one-time code unused. The page redeems (and burns) it instead.
 */
const isSignedOutOnlyPage = createRouteMatcher(["/sign-in", "/sign-up"]);

export async function signedInPageRedirect(
  request: NextRequest,
  isAuthenticated: () => Promise<boolean>,
): Promise<Response | undefined> {
  if (isSignedOutOnlyPage(request) && (await isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/home");
  }
  return undefined;
}
