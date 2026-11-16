"use client";

import { Layers } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { useStartAuth } from "@/components/auth/use-start-auth";
import { Button } from "@/components/ui/button";

export function DecksGuestBrowseBanner() {
  const startAuth = useStartAuth();

  return (
    <Banner>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span>Browsing public decks. Sign in to create and edit your own.</span>
      </div>
      <Button
        type="button"
        size="xs"
        className="shrink-0"
        onClick={() => startAuth()}
      >
        Sign in to build
      </Button>
    </Banner>
  );
}
