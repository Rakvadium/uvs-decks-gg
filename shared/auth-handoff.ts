/**
 * Pure helpers for the central auth handoff (see docs/multi-game.md "Central auth host").
 * Runtime-agnostic: used by src/ (`@shared/auth-handoff`) and convex/ (relative import).
 */
import { isAllowedHandoffOrigin, isLocalRoot, resolveHost, ROOT_DOMAINS } from "./hosts";

/** Handoff codes are single-use and short-lived. */
export const HANDOFF_CODE_TTL_MS = 60_000;

/** Informational cross-subdomain hint that the apex has a session (never trusted). */
export const SIGNED_IN_HINT_COOKIE = "tcgd_signed_in";
export const SIGNED_IN_HINT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** sessionStorage keys (per tab, per origin). */
export const HANDOFF_STATE_STORAGE_KEY = "tcgd:handoff-state";
export const SSO_TRIED_STORAGE_KEY = "tcgd:sso-tried";

export const HANDOFF_PROVIDER_ID = "handoff";
export const LOGIN_REQUIRED_ERROR = "login_required";

const STATE_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
/** 32 random bytes, base64url without padding. */
const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PARSE_BASE = "http://same-origin.invalid";

export function isValidHandoffState(value: unknown): value is string {
  return typeof value === "string" && STATE_PATTERN.test(value);
}

export function isValidHandoffCode(value: unknown): value is string {
  return typeof value === "string" && CODE_PATTERN.test(value);
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** `n` cryptographically random bytes as base64url (32 bytes → 43 chars). */
export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

/** Hex SHA-256 of a UTF-8 string. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * A host-relative path (`/x?y#z`) that stays on the current origin, or `fallback`.
 * Rejects protocol-relative (`//`), backslash tricks (`/\`), schemes and control characters.
 */
export function sanitizeSameOriginPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.length > 2048 ||
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    return fallback;
  }
  let url: URL;
  try {
    url = new URL(trimmed, PARSE_BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== PARSE_BASE) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Parse a handoff `return` URL: must be an absolute URL on an allowed game origin.
 * Returns the bare origin and the host-relative path (no fragment).
 */
export function parseHandoffReturnUrl(
  returnUrl: unknown,
  roots: readonly string[] = ROOT_DOMAINS,
): { origin: string; path: string } | null {
  if (typeof returnUrl !== "string" || returnUrl.length === 0 || returnUrl.length > 2048) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(returnUrl);
  } catch {
    return null;
  }
  if (url.username || url.password || !isAllowedHandoffOrigin(url.origin, roots)) {
    return null;
  }
  const path = sanitizeSameOriginPath(`${url.pathname}${url.search}`, "/");
  return { origin: url.origin, path };
}

/** `{apex}/auth/handoff?return=…&state=…[&silent=1][&flow=signUp]` */
export function buildHandoffStartUrl(
  apex: string,
  returnUrl: string,
  state: string,
  options: { silent?: boolean; flow?: "signIn" | "signUp" } = {},
): string {
  const params = new URLSearchParams({ return: returnUrl, state });
  if (options.silent) {
    params.set("silent", "1");
  }
  if (options.flow === "signUp") {
    params.set("flow", "signUp");
  }
  return `${apex}/auth/handoff?${params.toString()}`;
}

/**
 * Query param carrying the one-time code. Not `code`: Convex Auth's middleware and client
 * treat `?code=` as their own verification code and consume it.
 */
export const HANDOFF_CODE_PARAM = "handoff_code";

/** `{origin}/auth/callback?handoff_code|error&state&next` */
export function buildHandoffCallbackUrl(
  origin: string,
  params: { code?: string; error?: string; state?: string | null; next: string },
): string {
  const search = new URLSearchParams();
  if (params.code) {
    search.set(HANDOFF_CODE_PARAM, params.code);
  }
  if (params.error) {
    search.set("error", params.error);
  }
  if (params.state) {
    search.set("state", params.state);
  }
  search.set("next", sanitizeSameOriginPath(params.next, "/"));
  return `${origin}/auth/callback?${search.toString()}`;
}

export interface HandoffCodeRecordLike {
  origin: string;
  state?: string;
  expiresAt: number;
  usedAt?: number;
}

export type HandoffCodeCheck =
  | "ok"
  | "not_found"
  | "used"
  | "expired"
  | "origin_mismatch"
  | "state_mismatch";

/**
 * Whether a stored code may be redeemed by `origin` with `state` at `now`. When the code was
 * minted with a `state`, the redeemer must present the exact same value.
 */
export function checkHandoffCode(
  record: HandoffCodeRecordLike | null | undefined,
  origin: string,
  now: number,
  state?: string | null,
): HandoffCodeCheck {
  if (!record) {
    return "not_found";
  }
  if (record.usedAt !== undefined) {
    return "used";
  }
  if (record.expiresAt <= now) {
    return "expired";
  }
  if (record.origin !== origin) {
    return "origin_mismatch";
  }
  if (record.state !== undefined && record.state !== state) {
    return "state_mismatch";
  }
  return "ok";
}

/** Root domain whose subdomains share the hint cookie, for a hostname (apex or game), or null. */
export function hintCookieRoot(
  host: string,
  roots: readonly string[] = ROOT_DOMAINS,
): string | null {
  const info = resolveHost(host, roots);
  return info.kind === "standalone" ? null : info.root;
}

const HINT_VALUE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/**
 * Hint value written on sign-out / `login_required` instead of deleting the cookie, so a game
 * host still holding a not-yet-expired JWT doesn't "backfill" the hint for a gone session.
 */
export const SIGNED_OUT_HINT_VALUE = "0";

/**
 * `Set-Cookie`-style string for `document.cookie` (set or clear). `value` identifies the apex
 * session the hint was written for (a random token), so per-tab "silent SSO tried" markers can
 * be invalidated when a new session appears; legacy cookies carry `1`.
 */
export function buildSignedInHintCookie(
  root: string,
  options: { secure: boolean; clear?: boolean; signedOut?: boolean; value?: string },
): string {
  const value = options.clear
    ? ""
    : options.signedOut
      ? SIGNED_OUT_HINT_VALUE
      : options.value && HINT_VALUE_PATTERN.test(options.value)
        ? options.value
        : "1";
  const parts = [
    `${SIGNED_IN_HINT_COOKIE}=${value}`,
    // `.localhost` roots are not on the public suffix list, so a Domain attribute works there.
    `Domain=.${root}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${options.clear ? 0 : SIGNED_IN_HINT_MAX_AGE_SECONDS}`,
  ];
  if (options.secure || !isLocalRoot(root)) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function rawHintValue(cookieHeader: string | null | undefined): string | null {
  for (const part of (cookieHeader ?? "").split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1 || trimmed.slice(0, eq) !== SIGNED_IN_HINT_COOKIE) continue;
    const value = trimmed.slice(eq + 1);
    if (HINT_VALUE_PATTERN.test(value)) {
      return value;
    }
  }
  return null;
}

/** The hint cookie's signed-in value (well-formed, not the signed-out marker), or null. */
export function readSignedInHintValue(cookieHeader: string | null | undefined): string | null {
  const value = rawHintValue(cookieHeader);
  return value === SIGNED_OUT_HINT_VALUE ? null : value;
}

/** Whether the hint was never written in this browser (no signed-in or signed-out marker). */
export function isSignedInHintAbsent(cookieHeader: string | null | undefined): boolean {
  return rawHintValue(cookieHeader) === null;
}

export function hasSignedInHint(cookieHeader: string | null | undefined): boolean {
  return readSignedInHintValue(cookieHeader) !== null;
}

/**
 * Pending login-CSRF `state` values for this tab (sessionStorage JSON: state → createdAt).
 * A set rather than a single slot so a second handoff (silent SSO, another click) started
 * before the first returns can't invalidate it.
 */
export const HANDOFF_STATE_TTL_MS = 15 * 60_000;
const MAX_PENDING_STATES = 8;

export function parsePendingStates(raw: string | null | undefined, now: number): Record<string, number> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Legacy single-slot value.
    return isValidHandoffState(raw) ? { [raw]: now } : {};
  }
  const result: Record<string, number> = {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return result;
  for (const [state, createdAt] of Object.entries(parsed as Record<string, unknown>)) {
    if (
      isValidHandoffState(state) &&
      typeof createdAt === "number" &&
      createdAt <= now &&
      now - createdAt < HANDOFF_STATE_TTL_MS
    ) {
      result[state] = createdAt;
    }
  }
  return result;
}

/** Add `state` (dropping expired and the oldest beyond the cap); returns the new raw value. */
export function addPendingState(raw: string | null | undefined, state: string, now: number): string {
  const states = parsePendingStates(raw, now);
  states[state] = now;
  const kept = Object.entries(states)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PENDING_STATES);
  return JSON.stringify(Object.fromEntries(kept));
}

/**
 * Remove `state` if pending. `raw` is the new stored value (null when nothing is left).
 */
export function takePendingState(
  raw: string | null | undefined,
  state: unknown,
  now: number,
): { matched: boolean; raw: string | null } {
  const states = parsePendingStates(raw, now);
  const matched = isValidHandoffState(state) && Object.hasOwn(states, state);
  if (matched) {
    delete states[state];
  }
  return { matched, raw: Object.keys(states).length > 0 ? JSON.stringify(states) : null };
}

/** Paths whose page drives an auth redirect itself (no silent SSO, no unsaved-changes prompt). */
export function isAuthFlowPath(pathname: string): boolean {
  return (
    pathname.startsWith("/auth/") ||
    ["/sign-in", "/sign-up"].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}
