"use client";

import { useCallback } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useHostKind } from "@/games/game-context";
import { clearSignedInHint, currentApexOrigin } from "./handoff-client";

/**
 * Sign out for the current host. Game/apex hosts revoke every session of the user (all
 * subdomains), clear the hint cookie and, on game hosts, bounce through the apex so it clears
 * its own cookies. Standalone hosts only sign out locally (unchanged behavior).
 *
 * Resolves to `"redirecting"` when the browser is leaving the page, else `"done"`.
 */
export function useAppSignOut(): () => Promise<"redirecting" | "done"> {
  const authActions = useAuthActions();
  const hostKind = useHostKind();
  const signOutEverywhere = useMutation(api.authHandoff.signOutEverywhere);

  return useCallback(async () => {
    if (hostKind === "standalone") {
      await authActions?.signOut?.();
      return "done";
    }
    try {
      await signOutEverywhere({});
    } catch (error) {
      // Still sign out locally; other hosts expire on their own.
      console.error(error);
    }
    await authActions?.signOut?.();
    clearSignedInHint();
    const apex = hostKind === "game" ? currentApexOrigin() : null;
    if (apex) {
      const returnUrl = `${window.location.origin}/`;
      window.location.assign(`${apex}/auth/signed-out?return=${encodeURIComponent(returnUrl)}`);
      return "redirecting";
    }
    return "done";
  }, [authActions, hostKind, signOutEverywhere]);
}
