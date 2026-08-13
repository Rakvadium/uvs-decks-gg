"use client";

import { useCallback } from "react";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";
import { useAuthDialog } from "@/components/auth/auth-dialog";

export function useCreatorApply() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();

  const startCreatorApply = useCallback(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      toast.message("Create an account to apply for creator verification.");
      openAuthDialog("signUp");
      return;
    }

    toast.message("Verification submit is not open yet. Review the path below.");
    const nodes = document.querySelectorAll("#creator-verification");
    for (const node of nodes) {
      if (node instanceof HTMLElement && node.getClientRects().length > 0) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
    }
  }, [isAuthenticated, isLoading, openAuthDialog]);

  return { startCreatorApply };
}
