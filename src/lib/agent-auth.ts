import { sanitizeAgentLoginNextPath } from "./agent-auth-shared";

export { sanitizeAgentLoginNextPath };

function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let mismatch = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return mismatch === 0;
}

export function isAgentAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.VERCEL !== "1";
}

export type AgentAuthCredentials = {
  email: string;
  password: string;
  username: string;
};

export function getAgentAuthCredentials(): AgentAuthCredentials | null {
  if (!isAgentAuthEnabled()) return null;

  const secret = process.env.AGENT_AUTH_SECRET?.trim() ?? "";
  const email = process.env.AGENT_AUTH_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.AGENT_AUTH_PASSWORD ?? "";
  const username = (process.env.AGENT_AUTH_USERNAME?.trim() || "agent").toLowerCase();

  if (!secret || !email || !password) return null;
  if (password.length < 8 || !/\d/.test(password)) return null;
  if (username.length < 1 || username.length > 20) return null;

  return { email, password, username };
}

export function assertAgentAuthSecret(provided: string): AgentAuthCredentials {
  if (!isAgentAuthEnabled()) {
    throw new Error("Agent auth is only available in local development");
  }

  const credentials = getAgentAuthCredentials();
  const expected = process.env.AGENT_AUTH_SECRET?.trim() ?? "";

  if (!credentials || !expected) {
    throw new Error("Agent auth is not configured");
  }

  if (!provided || !timingSafeEqualString(provided, expected)) {
    throw new Error("Invalid agent auth secret");
  }

  return credentials;
}

export function readAgentAuthSecretFromRequest(req: Request, bodySecret?: unknown): string {
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  if (bearer) return bearer;

  const headerSecret = req.headers.get("x-agent-auth-secret")?.trim() ?? "";
  if (headerSecret) return headerSecret;

  if (typeof bodySecret === "string") return bodySecret.trim();
  return "";
}
