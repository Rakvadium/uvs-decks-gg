"use client";

import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeckDetailsTopBarContext } from "./context";
import { DeckDetailsTopBarLoadingState } from "./loading-state";
import { DeckDetailsTopBarTitleSection } from "./title-section";
import { DeckDetailsTopBarViewActions } from "./view-actions";

export function DeckDetailsTopBarInner() {
  const { deck, isLoading, isOwner, startEditing } = useDeckDetailsTopBarContext();

  if (isLoading || !deck) {
    return <DeckDetailsTopBarLoadingState />;
  }

  return (
    <div className="flex w-full min-w-0 items-start gap-2">
      <Link href="/decks" aria-label="Decks" className="shrink-0 pt-0.5">
        <Button variant="ghost" size="icon" aria-label="Decks">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      <DeckDetailsTopBarTitleSection compact />

      <div className="ml-auto flex shrink-0 items-center gap-2 pt-0.5">
        {isOwner ? (
          <>
            <DeckDetailsTopBarViewActions compact />
            <Button
              variant="outline"
              size="icon"
              aria-label="Edit deck details"
              onClick={() => startEditing()}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <DeckDetailsTopBarViewActions compact />
        )}
      </div>
    </div>
  );
}

export function DeckDetailsTopBar() {
  return <DeckDetailsTopBarInner />;
}
