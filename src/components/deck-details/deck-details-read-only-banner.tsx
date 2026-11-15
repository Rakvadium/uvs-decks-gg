"use client";

import { Eye } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { useConvexAuth } from "convex/react";
import { useStartAuth } from "@/components/auth/use-start-auth";
import { Button } from "@/components/ui/button";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

export function DeckDetailsReadOnlyBanner() {
  const { deck, isOwner } = useDeckDetails();
  const { isAuthenticated } = useConvexAuth();
  const startAuth = useStartAuth();

  if (!deck || isOwner) return null;

  return (
    <Banner>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span>You&apos;re viewing this deck in read-only mode.</span>
      </div>
      {!isAuthenticated ? (
        <Button
          type="button"
          size="xs"
          className="shrink-0"
          onClick={() => startAuth()}
        >
          Sign in to edit
        </Button>
      ) : null}
    </Banner>
  );
}
