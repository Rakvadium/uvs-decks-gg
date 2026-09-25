/**
 * Browser-side helpers for the central auth handoff (docs/multi-game.md "Central auth host").
 * Pure URL/cookie logic lives in `@shared/auth-handoff`; this file touches window/document.
 */
import {
  buildHandoffStartUrl,
  buildSignedInHintCookie,
  HANDOFF_STATE_STORAGE_KEY,
  hasSignedInHint,
  hintCookieRoot,
  isValidHandoffState,
  randomToken,
  sanitizeSameOriginPath,
  SSO_TRIED_STORAGE_KEY,
} from "@shared/auth-handoff";
import { apexOrigin, resolveHost } from "@shared/hosts";

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

/** Generate a fresh login-CSRF `state` and remember it for this tab. */
export function createHandoffState(): string {
  const state = randomToken(24);
  safeSessionStorage()?.setItem(HANDOFF_STATE_STORAGE_KEY, state);
  return state;
}

/** Compare `state` with the stored one; the stored value is removed either way. */
export function consumeHandoffState(state: unknown): boolean {
  const storage = safeSessionStorage();
  const expected = storage?.getItem(HANDOFF_STATE_STORAGE_KEY) ?? null;
  storage?.removeItem(HANDOFF_STATE_STORAGE_KEY);
  return isValidHandoffState(state) && expected !== null && expected === state;
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
  window.location.assign(url);
  return true;
}

function writeHintCookie(clear: boolean): void {
  const root = hintCookieRoot(window.location.host);
  if (!root) {
    return;
  }
  document.cookie = buildSignedInHintCookie(root, {
    secure: window.location.protocol === "https:",
    clear,
  });
}

export function setSignedInHint(): void {
  writeHintCookie(false);
}

export function clearSignedInHint(): void {
  writeHintCookie(true);
}

export function readSignedInHint(): boolean {
  return hasSignedInHint(document.cookie);
}

export function hasTriedSilentSso(): boolean {
  return safeSessionStorage()?.getItem(SSO_TRIED_STORAGE_KEY) === "1";
}

export function markSilentSsoTried(): void {
  safeSessionStorage()?.setItem(SSO_TRIED_STORAGE_KEY, "1");
}
