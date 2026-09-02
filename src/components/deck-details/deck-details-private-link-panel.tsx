"use client";

import { useCallback, useMemo } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { normalizeDeckVisibility } from "@/lib/deck/visibility";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

export function DeckDetailsPrivateLinkPanel() {
  const { deck, isOwner } = useDeckDetails();

  const deckUrl = useMemo(() => {
    if (typeof window === "undefined" || !deck) return "";
    return `${window.location.origin}/decks/${deck._id}`;
  }, [deck]);

  const onCopyLink = useCallback(async () => {
    if (!deckUrl) return;
    try {
      await navigator.clipboard.writeText(deckUrl);
      toast.success("Deck link copied to clipboard.");
    } catch {
      toast.error("Could not copy link.");
    }
  }, [deckUrl]);

  if (!deck || !isOwner || normalizeDeckVisibility(deck) !== "unlisted") return null;

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3">
      <div className="space-y-1">
        <p className="chrome-label-case flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Link2 className="h-3 w-3" />
          Share link
        </p>
        <p className="text-xs text-muted-foreground">
          Anyone with this link can view the deck in read-only mode. It is not listed publicly.
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" className="h-9 w-full" onClick={() => void onCopyLink()}>
        Copy link
      </Button>
    </div>
  );
}
