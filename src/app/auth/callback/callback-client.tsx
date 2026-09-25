"use client";

import { useEffect, useRef, useState } from "react";
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
  HANDOFF_PROVIDER_ID,
  isValidHandoffCode,
  LOGIN_REQUIRED_ERROR,
  sanitizeSameOriginPath,
} from "@shared/auth-handoff";

/**
 * Game host `/auth/callback`: strips the one-time code from the URL, checks `state`, then
 * redeems the code via the `handoff` credentials provider and continues to `next`.
 */
export function CallbackClient() {
  const router = useRouter();
  const hostKind = useHostKind();
  const { signIn } = useAuthActions();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Read then immediately strip the query so the code never lingers in history/Referer.
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState(window.history.state, "", window.location.pathname);

    const code = params.get("code");
    const state = params.get("state");
    const next = sanitizeSameOriginPath(params.get("next"), "/");
    const stateMatches = consumeHandoffState(state);

    const fail = (message: string) => {
      setNextPath(next);
      setError(message);
    };

    if (hostKind !== "game") {
      fail("Sign-in callbacks are only valid on game sites.");
      return;
    }
    if (params.get("error") === LOGIN_REQUIRED_ERROR) {
      // Silent SSO found no apex session: don't retry in this tab.
      markSilentSsoTried();
      router.replace(next);
      return;
    }
    if (!stateMatches || !isValidHandoffCode(code)) {
      fail("This sign-in link is invalid or was already used.");
      return;
    }

    const args = { code, origin: window.location.origin };
    const run = async () => {
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
        router.replace(next);
      } catch (signInError) {
        console.error(signInError);
        fail("Could not complete sign-in. The link may have expired.");
      }
    };
    void run();
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
