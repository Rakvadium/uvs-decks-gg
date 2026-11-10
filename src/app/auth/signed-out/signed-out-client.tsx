"use client";

import { useEffect, useRef } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthStatusScreen } from "@/components/auth/auth-status-screen";
import { clearSignedInHint } from "@/lib/auth/handoff-client";
import { leavePage } from "@/lib/navigation/leave-page";
import { parseHandoffReturnUrl } from "@shared/auth-handoff";

/**
 * Apex `/auth/signed-out`: clears the apex's own auth cookies after a game host signed out
 * everywhere, then returns to the (validated) game origin.
 */
export function SignedOutClient({ returnUrl }: { returnUrl: string }) {
  const { signOut } = useAuthActions();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const target = parseHandoffReturnUrl(returnUrl);
    const destination = target ? `${target.origin}${target.path}` : "/";
    signOut()
      .catch((error: unknown) => console.error(error))
      .finally(() => {
        clearSignedInHint();
        leavePage(destination, { replace: true });
      });
  }, [returnUrl, signOut]);

  return <AuthStatusScreen heading="Signing out" status="Signing you out…" />;
}
