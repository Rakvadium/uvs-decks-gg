"use client";

import { Layers } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";

export function DecksGuestBrowseBanner() {
  const { openAuthDialog } = useAuthDialog();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/60 px-3 py-2 text-xs text-foreground/80">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span>Browsing public decks. Sign in to create and edit your own.</span>
      </div>
      <Button
        type="button"
        size="sm"
        className="h-7 shrink-0 px-2.5 text-xs"
        onClick={() => openAuthDialog()}
      >
        Sign in to build
      </Button>
    </div>
  );
}
