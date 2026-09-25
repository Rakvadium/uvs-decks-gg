import { convexAuthNextjsMiddleware, createRouteMatcher, nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { routeRequest, type RouteDecision } from "@/lib/routing/route-request";

const isPublicPage = createRouteMatcher(["/sign-in", "/sign-up", "/agent-login"]);
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
  if (isPublicPage(request) && await convexAuth.isAuthenticated()) {
    return nextjsMiddlewareRedirect(request, "/home");
  }
  return applyDecision(request, decision);
}, {
  cookieConfig: {
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
