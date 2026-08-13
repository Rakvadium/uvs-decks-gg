"use client";

import { useConvexAuth } from "convex/react";
import { PageHeading } from "@/components/ui/typography-headings";
import { DecksPagePrimaryAction } from "./top-bar";

export function DecksViewHeading() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <PageHeading className="font-display text-2xl font-bold uppercase tracking-widest">Deck Database</PageHeading>
        <p className="font-mono text-sm tracking-wide text-muted-foreground">
          {isAuthenticated
            ? "Build, browse, and manage decks"
            : "Browse public decks — sign in to build"}
        </p>
      </div>
      <DecksPagePrimaryAction className="w-full justify-center" />
    </div>
  );
}
