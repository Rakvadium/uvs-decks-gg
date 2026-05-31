"use client";

import { Eye } from "lucide-react";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

export function DeckDetailsReadOnlyBanner() {
  const { deck, isOwner } = useDeckDetails();

  if (!deck || isOwner) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Eye className="h-3.5 w-3.5 shrink-0" />
      <span>You&apos;re viewing this deck in read-only mode.</span>
    </div>
  );
}
