"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHostKind } from "@/games/game-context";
import { currentPathWithSearch, startHandoff } from "@/lib/auth/handoff-client";
import { authPageHref, type AuthEntryFlow } from "./flow";

/**
 * Send the user to sign in (or sign up) and bring them back to the current page afterwards.
 * Game hosts hand off to the apex auth page; apex and standalone hosts go to their own.
 */
export function useStartAuth() {
  const router = useRouter();
  const hostKind = useHostKind();

  return useCallback(
    (flow: AuthEntryFlow = "signIn") => {
      const here = currentPathWithSearch();
      if (hostKind === "game" && startHandoff(here, { flow })) return;
      router.push(authPageHref(flow, here));
    },
    [hostKind, router],
  );
}
