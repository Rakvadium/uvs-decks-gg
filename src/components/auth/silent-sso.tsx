"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useHostKind } from "@/games/game-context";
import {
  currentPathWithSearch,
  hasTriedSilentSso,
  isHandoffInFlight,
  isSignedInHintAbsent,
  markSilentSsoTried,
  readSignedInHint,
  setSignedInHint,
  startHandoff,
} from "@/lib/auth/handoff-client";
import { isAuthFlowPath } from "@shared/auth-handoff";

/** Right after a sign-in the client can briefly report signed-out; don't act on that. */
const SIGNED_OUT_GRACE_MS = 600;

/**
 * Keeps the `tcgd_signed_in` hint cookie in sync and, on game hosts that are signed out while
 * the hint exists, tries one silent handoff per tab per hint value to pick up the apex session.
 *
 * - Apex, signed in: ensure the hint exists (covers sign-ins that never went through
 *   `/auth/handoff`, e.g. the local dialog on the apex).
 * - Game host, signed in, hint never written (sessions created before the hint existed): set
 *   it so other game hosts try silent SSO. Not after a sign-out/`login_required` marker — this
 *   host may still hold an unexpired JWT for a revoked session. A missing apex session just
 *   yields `login_required`, which writes the signed-out marker.
 */
export function SilentSso() {
  const hostKind = useHostKind();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (hostKind === "standalone" || isLoading) return;
    // `/auth/*` pages manage the hint themselves (handoff sets it, signed-out clears it). Other
    // auth pages still count on the apex: a dialog sign-in there may never leave `/sign-in`.
    if (pathname.startsWith("/auth/")) return;
    if (isAuthenticated) {
      if (readSignedInHint() !== null) return;
      if (hostKind === "apex" || isSignedInHintAbsent()) {
        setSignedInHint();
      }
      // Our own session exists: no silent SSO needed for this hint value.
      markSilentSsoTried();
      return;
    }
    if (hostKind !== "game" || isAuthFlowPath(pathname)) return;
    if (isHandoffInFlight() || hasTriedSilentSso() || readSignedInHint() === null) return;
    const timer = window.setTimeout(() => {
      if (isHandoffInFlight() || hasTriedSilentSso() || readSignedInHint() === null) return;
      markSilentSsoTried();
      startHandoff(currentPathWithSearch(), { silent: true });
    }, SIGNED_OUT_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [hostKind, isAuthenticated, isLoading, pathname]);

  return null;
}
