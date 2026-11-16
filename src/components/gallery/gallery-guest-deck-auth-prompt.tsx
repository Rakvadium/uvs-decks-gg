"use client";

import { FolderKanban } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { useStartAuth } from "@/components/auth/use-start-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GalleryGuestDeckAuthPrompt({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const startAuth = useStartAuth();

  return (
    <Banner className={cn("flex-col flex-nowrap items-stretch gap-3 py-3", className)}>
      <div className="flex items-start gap-2">
        <FolderKanban aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0 text-xs leading-relaxed text-foreground/80">
          {compact
            ? "Sign in to build decks from the gallery: pick an active deck and add cards while you browse."
            : "Sign in to use deck tools from the gallery: pick an active deck, add cards from the catalog, and keep everything synced while you browse."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => startAuth("signIn")}>
          Sign in
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => startAuth("signUp")}
        >
          Create account
        </Button>
      </div>
    </Banner>
  );
}
