"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthStatusScreen } from "@/components/auth/auth-status-screen";
import { clearAuthCookies, isRefreshTokenParseError } from "@/components/auth/auth-recovery";
import { Button } from "@/components/ui/button";
import { useHostKind } from "@/games/game-context";
import {
  consumeHandoffState,
  markSilentSsoTried,
  startHandoff,
} from "@/lib/auth/handoff-client";
import {
  HANDOFF_CODE_PARAM,
  HANDOFF_PROVIDER_ID,
  isValidHandoffCode,
  LOGIN_REQUIRED_ERROR,
  sanitizeSameOriginPath,
} from "@shared/auth-handoff";

type CallbackOutcome = { next: string; error: string | null };

/**
 * One redemption per callback URL per page load. Module-level (not a ref) so a remount — React
 * StrictMode's double effects or a provider/router re-render — reuses the in-flight attempt
 * instead of re-reading the already-stripped URL and the already-consumed `state`.
 */
let activeCallback: { search: string; outcome: Promise<CallbackOutcome> } | null = null;

type SignInFn = ReturnType<typeof useAuthActions>["signIn"];

async function redeemHandoff(
  params: URLSearchParams,
  hostKind: string,
  signIn: SignInFn,
): Promise<CallbackOutcome> {
  const code = params.get(HANDOFF_CODE_PARAM);
  const state = params.get("state");
  const next = sanitizeSameOriginPath(params.get("next"), "/");
  const stateMatches = consumeHandoffState(state);

  if (hostKind !== "game") {
    return { next, error: "Sign-in callbacks are only valid on game sites." };
  }
  if (params.get("error") === LOGIN_REQUIRED_ERROR) {
    // Silent SSO found no apex session: don't retry in this tab (for this hint).
    markSilentSsoTried();
    return { next, error: null };
  }
  if (!stateMatches || !isValidHandoffCode(code)) {
    return { next, error: "This sign-in link is invalid or was already used." };
  }

  // `state` is re-checked server-side against the value the code was minted with.
  const args = { code, origin: window.location.origin, ...(state ? { state } : {}) };
  try {
    let result;
    try {
      result = await signIn(HANDOFF_PROVIDER_ID, args);
    } catch (signInError) {
      if (!isRefreshTokenParseError(signInError)) throw signInError;
      await clearAuthCookies();
      result = await signIn(HANDOFF_PROVIDER_ID, args);
    }
    if (!result.signingIn) {
      throw new Error("Handoff sign-in did not complete");
    }
    // Signed in: silent SSO must not bounce to the apex again while the new token settles.
    markSilentSsoTried();
    return { next, error: null };
  } catch (signInError) {
    console.error(signInError);
    return { next, error: "Could not complete sign-in. The link may have expired." };
  }
}

/**
 * Game host `/auth/callback`: strips the one-time code from the URL, checks `state`, then
 * redeems the code via the `handoff` credentials provider and continues to `next`.
 */
export function CallbackClient() {
  const router = useRouter();
  const hostKind = useHostKind();
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    const search = window.location.search;
    // An empty query means this page load already stripped it: join the attempt in flight.
    if (!activeCallback || (search !== "" && search !== activeCallback.search)) {
      // Read then immediately strip the query so the code never lingers in history/Referer.
      const params = new URLSearchParams(search);
      window.history.replaceState(window.history.state, "", window.location.pathname);
      activeCallback = { search, outcome: redeemHandoff(params, hostKind, signIn) };
    }

    let cancelled = false;
    void activeCallback.outcome.then((outcome) => {
      if (cancelled) return;
      if (outcome.error) {
        setNextPath(outcome.next);
        setError(outcome.error);
        return;
      }
      router.replace(outcome.next);
    });
    return () => {
      cancelled = true;
    };
  }, [hostKind, router, signIn]);

  return (
    <AuthStatusScreen
      heading="Signing in"
      status={error ? "Sign-in failed" : "Finishing sign-in…"}
      error={error}
    >
      {error && hostKind === "game" ? (
        <Button type="button" onClick={() => startHandoff(nextPath)}>
          Try again
        </Button>
      ) : null}
    </AuthStatusScreen>
  );
}
