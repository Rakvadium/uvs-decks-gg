import { convexAuthNextjsMiddleware, createRouteMatcher } from "@convex-dev/auth/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_ENTRY_PATHS,
  authenticatedAuthEntryRedirect,
  routeRequest,
  type RouteDecision,
} from "@/lib/routing/route-request";
import { isGameId } from "@shared/games/types";
import { catalogCachedCookieName } from "@/lib/universus/catalog-prefetch";
import { catalogPreloadLink } from "@/lib/universus/catalog-preload";

const isPublicPage = createRouteMatcher([...AUTH_ENTRY_PATHS]);
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function forwardedHeaders(request: NextRequest, extra: Record<string, string>): Headers {
  // `request.headers` already carries any refreshed auth cookies from convexAuth; our values
  // overwrite client-supplied x-tcg-* headers.
  const headers = new Headers(request.headers);
  for (const [name, value] of Object.entries(extra)) {
    headers.set(name, value);
  }
  return headers;
}

function applyDecision(request: NextRequest, decision: RouteDecision): NextResponse {
  switch (decision.type) {
    case "redirect":
      return NextResponse.redirect(decision.url, decision.status);
    case "rewrite":
    case "notFound":
      return NextResponse.rewrite(new URL(decision.url, request.url), {
        request: { headers: forwardedHeaders(request, decision.headers) },
      });
    case "next":
      return NextResponse.next({
        request: { headers: forwardedHeaders(request, decision.headers) },
      });
  }
}

const GALLERY_PAGE_PATH = /^\/([^/?]+)\/gallery\/?(?:\?|$)/;

/**
 * Adds a `Link` preload header for the static catalog to full gallery page loads, so the download
 * starts before the HTML and page JS arrive (src/lib/universus/catalog-preload.ts).
 */
async function withCatalogPreload(
  request: NextRequest,
  decision: RouteDecision,
  response: NextResponse
): Promise<NextResponse> {
  if (decision.type !== "rewrite" || request.headers.has("rsc")) return response;
  const game = GALLERY_PAGE_PATH.exec(decision.url)?.[1];
  if (!game || !isGameId(game)) return response;
  const link = await catalogPreloadLink(game, request.cookies.get(catalogCachedCookieName(game))?.value);
  if (link) response.headers.append("Link", link);
  return response;
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const decision = routeRequest({
    host: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    protocol: request.nextUrl.protocol,
  });
  if (decision.type === "redirect") {
    return applyDecision(request, decision);
  }
  // Page navigations only: Convex Auth posts its `invalidateCache` server action to the current
  // page right after sign-in; redirecting that POST (e.g. `/sign-in` → `/home` → game host,
  // cross-origin) makes the fetch fail and the client sign-in reject.
  const isPageNavigation =
    (request.method === "GET" || request.method === "HEAD") && !request.headers.has("next-action");
  if (isPageNavigation && isPublicPage(request) && await convexAuth.isAuthenticated()) {
    // Same-origin path only (sanitized), so this can't become an open redirect.
    const target = new URL(authenticatedAuthEntryRedirect(request.nextUrl.search), request.url);
    return NextResponse.redirect(target);
  }
  const response = applyDecision(request, decision);
  return isPageNavigation ? withCatalogPreload(request, decision, response) : response;
}, {
  cookieConfig: {
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
