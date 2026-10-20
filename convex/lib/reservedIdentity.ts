/**
 * Reserved test identities used by automated agents. These accounts can never
 * hold admin rights or authenticate with a password, even on the live deployment.
 */
export const RESERVED_AGENT_EMAIL_DOMAIN = "validation.invalid";

/** Legacy password-based agent login account (`agent@localhost.dev`). */
const LEGACY_AGENT_LOCAL_PART = "agent";
const LEGACY_AGENT_DOMAIN = "localhost.dev";

export function isReservedAgentEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0) return false;
  const localPart = normalized.slice(0, at);
  const domain = normalized.slice(at + 1).replace(/\.+$/, "");
  if (
    domain === RESERVED_AGENT_EMAIL_DOMAIN ||
    domain.endsWith(`.${RESERVED_AGENT_EMAIL_DOMAIN}`)
  ) {
    return true;
  }
  return localPart === LEGACY_AGENT_LOCAL_PART && domain === LEGACY_AGENT_DOMAIN;
}

export function isReservedAgentUser(
  user: { email?: string } | null | undefined
): boolean {
  return isReservedAgentEmail(user?.email);
}
