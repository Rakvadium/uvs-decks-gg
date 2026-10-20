import { createRouteMatcher, nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";
import type { NextRequest } from "next/server";

/** Pages a signed-in visitor is sent away from (to `/home`). */
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
