"use client";

import { Copy, Edit3, Zap } from "lucide-react";

import {
  FloatingActionPill,
  FloatingBackPill,
  FloatingCapsuleCluster,
  FloatingPageBar,
} from "@/components/shell/floating-page-bar";
import { cn } from "@/lib/utils";
import { useDeckDetailsTopBarContext } from "./deck-details-top-bar/context";
import { Spinner } from "@/components/ui/spinner";

export function DeckDetailsFloatingTopBar() {
  const {
    deck,
    isLoading,
    isOwner,
    isActiveDeck,
    isDuplicating,
    setAsActiveDeck,
    startEditing,
    requestDuplicate,
  } = useDeckDetailsTopBarContext();

  if (isLoading || !deck) {
    return null;
  }

  return (
    <FloatingPageBar
      left={
        <div className="flex min-w-0 items-center gap-2">
          <FloatingBackPill href="/decks" label="Decks" />
          <FloatingCapsuleCluster
            className="min-w-0 max-w-[min(100%,28rem)]"
            bodyClassName="min-w-0 px-4"
            glow
          >
            <h1 className="chrome-heading-case truncate text-sm font-semibold text-foreground">
              {deck.name}
            </h1>
          </FloatingCapsuleCluster>
        </div>
      }
      right={
        <>
          {isOwner ? (
            <FloatingActionPill
              variant="floating"
              onClick={setAsActiveDeck}
              disabled={isActiveDeck}
              aria-label={isActiveDeck ? "Active deck" : "Set as active deck"}
              className={cn(isActiveDeck && "disabled:opacity-100")}
            >
              <Zap className={cn("h-3.5 w-3.5", isActiveDeck && "fill-primary text-primary")} />
              <span className="text-xs">{isActiveDeck ? "Active" : "Set Active"}</span>
            </FloatingActionPill>
          ) : null}
          <FloatingActionPill
            variant={isOwner ? "floating" : "default"}
            onClick={requestDuplicate}
            disabled={isDuplicating}
            aria-label="Duplicate deck"
          >
            {isDuplicating ? (
              <Spinner />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">Duplicate</span>
          </FloatingActionPill>
          {isOwner ? (
            <FloatingActionPill onClick={() => startEditing()}>
              <Edit3 className="h-3.5 w-3.5" />
              <span className="text-xs">Edit</span>
            </FloatingActionPill>
          ) : null}
        </>
      }
    />
  );
}
