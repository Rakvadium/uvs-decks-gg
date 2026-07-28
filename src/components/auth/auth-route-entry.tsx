"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import type { AuthDialogFlow } from "@/components/auth/dialog-flow";

type AuthRouteEntryProps = {
  flow: Extract<AuthDialogFlow, "signIn" | "signUp">;
  heading: string;
  description: string;
  actionLabel: string;
};

export function AuthRouteEntry({
  flow,
  heading,
  description,
  actionLabel,
}: AuthRouteEntryProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const openedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || isAuthenticated || openedRef.current) return;
    openedRef.current = true;
    openAuthDialog(flow);
  }, [flow, isAuthenticated, isLoading, openAuthDialog]);

  if (isLoading || isAuthenticated) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="space-y-4 text-center">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg border border-primary/30"
          style={{ boxShadow: "var(--chrome-deck-state-icon-shadow)" }}
        >
          <Lock className="h-10 w-10 text-primary/50" />
        </div>
        <p className="font-mono text-muted-foreground uppercase tracking-wider">
          {heading}
        </p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-col items-center gap-3 pt-2">
          <Button
            type="button"
            variant="default"
            onClick={() => openAuthDialog(flow)}
          >
            {actionLabel}
          </Button>
          <Link
            href="/home"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
