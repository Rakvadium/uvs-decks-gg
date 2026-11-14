"use client";

import { useCallback } from "react";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";
import { useStartAuth } from "@/components/auth/use-start-auth";

export function useCreatorApply() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const startAuth = useStartAuth();

  const startCreatorApply = useCallback(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      toast.message("Create an account to apply for creator verification.");
      startAuth("signUp");
      return;
    }

    toast.message("Verification submit is not open yet. Review the path below.");
    const target = document.getElementById("creator-verification");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isAuthenticated, isLoading, startAuth]);

  return { startCreatorApply };
}
