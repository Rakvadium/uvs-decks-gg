import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { signedInPageRedirect } from "@/lib/agent-auth-middleware";

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  return signedInPageRedirect(request, () => convexAuth.isAuthenticated());
}, {
  cookieConfig: {
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
