/**
 * Browser-side helpers for the central auth handoff (docs/multi-game.md "Central auth host").
 * Pure URL/cookie logic lives in `@shared/auth-handoff`; this file touches window/document.
 */
import {
  addPendingState,
  buildHandoffStartUrl,
  buildSignedInHintCookie,
  HANDOFF_STATE_STORAGE_KEY,
  hintCookieRoot,
  isSignedInHintAbsent as isHintAbsent,
  randomToken,
  readSignedInHintValue,
  sanitizeSameOriginPath,
  SSO_TRIED_STORAGE_KEY,
  takePendingState,
} from "@shared/auth-handoff";
import { apexOrigin, resolveHost } from "@shared/hosts";
import { leavePage } from "@/lib/navigation/leave-page";

/** Apex origin for a game/apex location (`{protocol}//{root}[:port]`), or null when standalone. */
export function apexOriginFor(location: { host: string; protocol: string }): string | null {
  const info = resolveHost(location.host);
  if (info.kind === "standalone") {
    return null;
  }
  return apexOrigin(info.root, location.protocol, info.port);
}

export function currentApexOrigin(): string | null {
  return typeof window === "undefined" ? null : apexOriginFor(window.location);
}

export function currentPathWithSearch(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Generate a fresh login-CSRF `state` and add it to this tab's pending set. */
export function createHandoffState(): string {
  const state = randomToken(24);
  const storage = safeSessionStorage();
  storage?.setItem(
    HANDOFF_STATE_STORAGE_KEY,
    addPendingState(storage.getItem(HANDOFF_STATE_STORAGE_KEY), state, Date.now()),
  );
  return state;
}

/** Whether `state` is pending for this tab; a match is removed (single use). */
export function consumeHandoffState(state: unknown): boolean {
  const storage = safeSessionStorage();
  if (!storage) return false;
  const { matched, raw } = takePendingState(
    storage.getItem(HANDOFF_STATE_STORAGE_KEY),
    state,
    Date.now(),
  );
  if (raw === null) {
    storage.removeItem(HANDOFF_STATE_STORAGE_KEY);
  } else {
    storage.setItem(HANDOFF_STATE_STORAGE_KEY, raw);
  }
  return matched;
}

let handoffInFlight = false;

/** True once this page has started navigating to the apex for a handoff. */
export function isHandoffInFlight(): boolean {
  return handoffInFlight;
}

/** `{apex}/auth/handoff?return={origin}{path}&state=…` for the current game host, or null. */
export function handoffStartUrl(
  returnPath: string,
  options: { silent?: boolean; flow?: "signIn" | "signUp" } = {},
): string | null {
  const apex = currentApexOrigin();
  if (!apex) {
    return null;
  }
  const state = createHandoffState();
  const returnUrl = `${window.location.origin}${sanitizeSameOriginPath(returnPath, "/")}`;
  return buildHandoffStartUrl(apex, returnUrl, state, options);
}

/** Navigate to the apex to sign in (or silently pick up its session). Returns false if standalone. */
export function startHandoff(
  returnPath: string,
  options: { silent?: boolean; flow?: "signIn" | "signUp" } = {},
): boolean {
  const url = handoffStartUrl(returnPath, options);
  if (!url) {
    return false;
  }
  if (!options.silent) {
    // An explicit sign-in supersedes silent SSO for this hint.
    markSilentSsoTried();
  }
  handoffInFlight = true;
  leavePage(url);
  return true;
}

function writeHintCookie(options: { signedOut?: boolean; value?: string }): void {
  const root = hintCookieRoot(window.location.host);
  if (!root) {
    return;
  }
  document.cookie = buildSignedInHintCookie(root, {
    secure: window.location.protocol === "https:",
    ...options,
  });
}

/**
 * Make sure the cross-subdomain hint exists. Keeps an existing value (same session); a new
 * random value marks a new session so game hosts that already gave up retry silent SSO.
 */
export function setSignedInHint(): void {
  if (readSignedInHintValue(document.cookie) !== null) return;
  writeHintCookie({ value: randomToken(12) });
}

/** Mark the apex session as gone (a signed-out marker, not a deletion; see `SIGNED_OUT_HINT_VALUE`). */
export function clearSignedInHint(): void {
  writeHintCookie({ signedOut: true });
}

/** True when no hint (signed in or out) was ever written for this root in this browser. */
export function isSignedInHintAbsent(): boolean {
  return isHintAbsent(document.cookie);
}

/** Current hint value (null when absent). */
export function readSignedInHint(): string | null {
  return readSignedInHintValue(document.cookie);
}

/** Whether silent SSO was already attempted in this tab for the current hint value. */
export function hasTriedSilentSso(): boolean {
  const tried = safeSessionStorage()?.getItem(SSO_TRIED_STORAGE_KEY) ?? null;
  return tried !== null && tried === (readSignedInHint() ?? "");
}

/** Remember that this tab tried (or no longer needs) silent SSO for the current hint value. */
export function markSilentSsoTried(): void {
  safeSessionStorage()?.setItem(SSO_TRIED_STORAGE_KEY, readSignedInHint() ?? "");
}
