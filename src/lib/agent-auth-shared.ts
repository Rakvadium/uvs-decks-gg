const DEFAULT_NEXT_PATH = "/home";
/** 32 random bytes as unpadded base64url (convex/agentLogin.ts). */
const AGENT_LOGIN_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** A same-origin path, else `/home`. Rejects `//`, `/\`, schemes and control characters. */
export function sanitizeAgentLoginNextPath(next: unknown): string {
  if (typeof next !== "string") return DEFAULT_NEXT_PATH;
  const trimmed = next.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://") ||
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    return DEFAULT_NEXT_PATH;
  }
  return trimmed;
}

/** Reads `#code=…&next=…`. A malformed code is treated as missing. */
export function parseAgentLoginFragment(hash: string): { code: string | null; nextPath: string } {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const code = params.get("code");
  return {
    code: code !== null && AGENT_LOGIN_CODE_PATTERN.test(code) ? code : null,
    nextPath: sanitizeAgentLoginNextPath(params.get("next") ?? undefined),
  };
}
