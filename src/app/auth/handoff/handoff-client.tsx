"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AuthStatusScreen } from "@/components/auth/auth-status-screen";
import { useHostKind } from "@/games/game-context";
import { clearSignedInHint, setSignedInHint } from "@/lib/auth/handoff-client";
import {
  buildHandoffCallbackUrl,
  isValidHandoffState,
  LOGIN_REQUIRED_ERROR,
  parseHandoffReturnUrl,
} from "@shared/auth-handoff";

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
    startedRef.current = true;

    const loginRequired = () => {
      clearSignedInHint();
      window.location.replace(
        buildHandoffCallbackUrl(target.origin, {
          error: LOGIN_REQUIRED_ERROR,
          state,
          next: target.path,
        }),
      );
    };

    if (!isAuthenticated) {
      if (silent) {
        loginRequired();
        return;
      }
      const here = `${window.location.pathname}${window.location.search}`;
      router.replace(`/${flow === "signUp" ? "sign-up" : "sign-in"}?next=${encodeURIComponent(here)}`);
      return;
    }

    createHandoff({ returnUrl, state })
      .then(({ redirectUrl }) => {
        if (new URL(redirectUrl).origin !== target.origin) {
          throw new Error("Unexpected redirect origin");
        }
        setSignedInHint();
        window.location.replace(redirectUrl);
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
      ) : null}
    </AuthStatusScreen>
  );
}
