import { isLoopbackUrl } from "../../convex/lib/validationBackend";

type Env = Record<string, string | undefined>;

/**
 * `/agent-login` exists only under `next dev`, off Vercel, against a loopback Convex backend.
 * Everywhere else the page is a 404 (and the `agent-code` provider refuses on its own).
 */
export function isAgentLoginPageEnabled(env: Env = process.env): boolean {
  return env.NODE_ENV === "development" && env.VERCEL !== "1" && isLoopbackUrl(env.NEXT_PUBLIC_CONVEX_URL);
}
