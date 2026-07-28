"use client";

import { Eye } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

export function DeckDetailsReadOnlyBanner() {
  const { deck, isOwner } = useDeckDetails();
  const { isAuthenticated } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();

  if (!deck || isOwner) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/60 px-3 py-2 text-xs text-foreground/80">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span>You&apos;re viewing this deck in read-only mode.</span>
      </div>
      {!isAuthenticated ? (
        <Button
          type="button"
          size="sm"
          className="h-7 shrink-0 px-2.5 text-xs"
          onClick={() => openAuthDialog()}
        >
          Sign in to edit
        </Button>
      ) : null}
    </div>
  );
}
