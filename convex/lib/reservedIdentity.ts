/**
 * Reserved test identities used by automated agents. These accounts can never
 * hold admin rights or authenticate with a password, even on the live deployment.
 */
export const RESERVED_AGENT_EMAIL_DOMAIN = "validation.invalid";

/** Legacy password-based agent login account (`agent@localhost.dev`, plus `agent+*` variants). */
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
  if (domain !== LEGACY_AGENT_DOMAIN) return false;
  // Plus-addressed variants (`agent+run@localhost.dev`) are the same mailbox.
  const mailbox = localPart.split("+", 1)[0];
  return mailbox === LEGACY_AGENT_LOCAL_PART;
}

export function isReservedAgentUser(
  user: { email?: string } | null | undefined
): boolean {
  return isReservedAgentEmail(user?.email);
}
