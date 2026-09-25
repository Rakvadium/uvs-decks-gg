"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AuthStatusScreen } from "@/components/auth/auth-status-screen";
import { useHostKind } from "@/games/game-context";
import { clearSignedInHint, setSignedInHint } from "@/lib/auth/handoff-client";
import { leavePage } from "@/lib/navigation/leave-page";
import {
  buildHandoffCallbackUrl,
  isValidHandoffState,
  LOGIN_REQUIRED_ERROR,
  parseHandoffReturnUrl,
} from "@shared/auth-handoff";

const SIGNED_OUT_GRACE_MS = 750;
const REDIRECT_RETRY_MS = 1500;

type HandoffClientProps = {
  returnUrl: string;
  state: string;
  silent: boolean;
  flow: "signIn" | "signUp";
};

/**
 * Apex `/auth/handoff`: mints a one-time code for the (validated) game origin and sends the
 * browser back to `{origin}/auth/callback`. Signed out → local sign-in (or `login_required`).
 */
export function HandoffClient({ returnUrl, state, silent, flow }: HandoffClientProps) {
  const router = useRouter();
  const hostKind = useHostKind();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const createHandoff = useMutation(api.authHandoff.create);
  const startedRef = useRef(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const target = useMemo(() => parseHandoffReturnUrl(returnUrl), [returnUrl]);
  const validationError =
    hostKind !== "apex"
      ? "Sign-in handoff is only available on the main site."
      : !target
        ? "Invalid return address."
        : !isValidHandoffState(state)
          ? "Invalid sign-in request."
          : null;

  useEffect(() => {
    if (validationError || !target || isLoading || startedRef.current) return;

    const loginRequired = () => {
      clearSignedInHint();
      leavePage(
        buildHandoffCallbackUrl(target.origin, {
          error: LOGIN_REQUIRED_ERROR,
          state,
          next: target.path,
        }),
        { replace: true },
      );
    };

    if (!isAuthenticated) {
      // Right after a sign-in the client can briefly report signed-out before the new token
      // is confirmed; wait before treating it as a real signed-out state.
      // Don't set startedRef here: if /sign-in bounces straight back (middleware sees the new
      // session cookie before the client does), this same instance must still mint the code
      // once the client reports authenticated.
      const timer = window.setTimeout(() => {
        if (silent) {
          loginRequired();
          return;
        }
        const here = `${window.location.pathname}${window.location.search}`;
        router.replace(`/${flow === "signUp" ? "sign-up" : "sign-in"}?next=${encodeURIComponent(here)}`);
      }, SIGNED_OUT_GRACE_MS);
      return () => window.clearTimeout(timer);
    }

    startedRef.current = true;
    createHandoff({ returnUrl, state })
      .then(({ redirectUrl }) => {
        if (new URL(redirectUrl).origin !== target.origin) {
          throw new Error("Unexpected redirect origin");
        }
        setSignedInHint();
        setRedirectTo(redirectUrl);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (silent) {
          loginRequired();
          return;
        }
        setFailure("Could not complete sign-in. Please try again.");
      });
  }, [createHandoff, flow, isAuthenticated, isLoading, returnUrl, router, silent, state, target, validationError]);

  // A script navigation started while the page is still hydrating can be dropped, so wait for
  // `load`, then retry once in case the first attempt was cancelled.
  useEffect(() => {
    if (!redirectTo) return;
    let retry: number | undefined;
    const go = () => {
      leavePage(redirectTo, { replace: true });
      retry = window.setTimeout(() => leavePage(redirectTo, { replace: true }), REDIRECT_RETRY_MS);
    };
    if (document.readyState === "complete") {
      go();
    } else {
      window.addEventListener("load", go, { once: true });
    }
    return () => {
      window.removeEventListener("load", go);
      window.clearTimeout(retry);
    };
  }, [redirectTo]);

  const error = validationError ?? failure;
  return (
    <AuthStatusScreen
      heading="Signing in"
      status={error ? "Sign-in failed" : "Connecting your account…"}
      error={error}
    >
      {error ? (
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Go home
        </Link>
      ) : redirectTo ? (
        <a
          href={redirectTo}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Continue
        </a>
      ) : null}
    </AuthStatusScreen>
  );
}
