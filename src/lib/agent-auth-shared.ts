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

/**
 * A copy of a `history.state` value with every occurrence of `hash` (e.g. `#code=…&next=…`)
 * removed from its strings. Next stores the initial URL, fragment included, in its router tree.
 */
export function stripFragment(state: unknown, hash: string): unknown {
  if (!hash) return state;
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") return value.split(hash).join("");
    if (Array.isArray(value)) return value.map(walk);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
    }
    return value;
  };
  return walk(state);
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
