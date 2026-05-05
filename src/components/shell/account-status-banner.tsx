"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function effectiveStatus(
  accountStatus: "active" | "suspended" | "banned" | "write_restricted" | undefined,
  statusExpiresAt: number | undefined
) {
  if (statusExpiresAt !== undefined && statusExpiresAt <= Date.now()) {
    return "active" as const;
  }
  return accountStatus ?? "active";
}

export function AccountStatusBanner() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(
    api.user.currentUser,
    isLoading ? "skip" : isAuthenticated ? {} : "skip"
  );
  const text = useMemo(() => {
    if (!user) return null;
    const s = effectiveStatus(user.accountStatus, user.statusExpiresAt);
    if (s === "active") return null;
    if (user.userFacingMessage && user.userFacingMessage.trim()) {
      return user.userFacingMessage.trim();
    }
    if (s === "write_restricted") {
      return "Your account is limited: you can update settings, but you cannot post decks, comments, or chat until the restriction is lifted.";
    }
    if (s === "suspended") {
      return "Your account is suspended. You can browse public content. Contact support if this is a mistake.";
    }
    if (s === "banned") {
      return "Your account is banned. You can browse public content. Contact support if this is a mistake.";
    }
    return null;
  }, [user]);
  if (!text) return null;
  return (
    <div className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 shrink-0">
      <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Account notice</AlertTitle>
        <AlertDescription className="text-balance">{text}</AlertDescription>
      </Alert>
    </div>
  );
}
