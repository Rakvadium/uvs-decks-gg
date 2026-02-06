import { convexAuthNextjsMiddleware, createRouteMatcher, nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";

const isPublicPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isPublicPage(request) && await convexAuth.isAuthenticated()) {
    return nextjsMiddlewareRedirect(request, "/home");
  }
}, {
  cookieConfig: {
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
