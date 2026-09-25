"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useHostKind } from "@/games/game-context";
import {
  currentPathWithSearch,
  hasTriedSilentSso,
  markSilentSsoTried,
  readSignedInHint,
  startHandoff,
} from "@/lib/auth/handoff-client";

const SKIP_PREFIXES = ["/auth/", "/sign-in", "/sign-up", "/agent-login"];

/**
 * Game hosts: when signed out but the apex left the `tcgd_signed_in` hint cookie, try one
 * silent handoff per tab session (`sessionStorage`) to pick up the apex session.
 */
export function SilentSso() {
  const hostKind = useHostKind();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (hostKind !== "game" || isLoading || isAuthenticated) return;
    if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    if (hasTriedSilentSso() || !readSignedInHint()) return;
    markSilentSsoTried();
    startHandoff(currentPathWithSearch(), { silent: true });
  }, [hostKind, isAuthenticated, isLoading, pathname]);

  return null;
}
