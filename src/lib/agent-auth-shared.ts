import { sanitizeSameOriginPath } from "@shared/auth-handoff";

/**
 * Same-origin path to continue to after agent login (default `/home`). Allows query strings,
 * e.g. `/auth/handoff?return=…&state=…` on the apex.
 */
export function sanitizeAgentLoginNextPath(next: unknown): string {
  return sanitizeSameOriginPath(next, "/home");
}
