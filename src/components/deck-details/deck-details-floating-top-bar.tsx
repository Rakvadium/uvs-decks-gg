"use client";

import { Edit3, Zap } from "lucide-react";
import {
  FLOATING_ACTION_PILL_CLASS,
  FloatingActionPill,
  FloatingBackPill,
  FloatingCapsuleCluster,
  FloatingPageBar,
} from "@/components/shell/floating-page-bar";
import { cn } from "@/lib/utils";
import { useDeckDetailsTopBarContext } from "./deck-details-top-bar/context";

export function DeckDetailsFloatingTopBar() {
  const { deck, isLoading, isOwner, isActiveDeck, setAsActiveDeck, startEditing } =
    useDeckDetailsTopBarContext();

  if (isLoading || !deck) {
    return null;
  }

  return (
    <FloatingPageBar
      left={
        <div className="flex min-w-0 items-center gap-2">
          <FloatingBackPill href="/decks" label="Back to all decks" iconOnly />
          <FloatingCapsuleCluster
            className="min-w-0 max-w-[min(100%,28rem)]"
            bodyClassName="min-w-0 px-4"
            glow
          >
            <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {deck.name}
            </h1>
          </FloatingCapsuleCluster>
        </div>
      }
      right={
        isOwner ? (
          <>
            <button
              type="button"
              onClick={setAsActiveDeck}
              disabled={isActiveDeck}
              aria-label={isActiveDeck ? "Active deck" : "Set as active deck"}
              className={cn(
                "pointer-events-auto inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition-colors",
                "shadow-[0_4px_16px_-10px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_36px_-16px_rgba(0,0,0,0.75)]",
                isActiveDeck
                  ? "cursor-default border border-primary/40 bg-background text-primary"
                  : "border border-border/60 bg-background/80 text-muted-foreground backdrop-blur-xl hover:border-primary/40 hover:bg-background hover:text-primary"
              )}
            >
              <Zap className={cn("h-3.5 w-3.5", isActiveDeck && "fill-primary text-primary")} />
              <span>{isActiveDeck ? "Active" : "Set Active"}</span>
            </button>
            <FloatingActionPill className={FLOATING_ACTION_PILL_CLASS} onClick={() => startEditing()}>
              <Edit3 className="h-3.5 w-3.5" />
              <span className="text-xs">Edit</span>
            </FloatingActionPill>
          </>
        ) : null
      }
    />
  );
}
