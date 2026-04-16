"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckDetailsTopBarProvider, useDeckDetailsTopBarContext } from "./context";
import { DeckDetailsTopBarEditActions } from "./edit-actions";
import { DeckDetailsTopBarLoadingState } from "./loading-state";
import { DeckDetailsTopBarTitleSection } from "./title-section";
import { DeckDetailsTopBarViewActions } from "./view-actions";

export function DeckDetailsTopBarInner() {
  const { deck, isEditing, isLoading } = useDeckDetailsTopBarContext();

  if (isLoading || !deck) {
    return <DeckDetailsTopBarLoadingState />;
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <Link href="/decks">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      <DeckDetailsTopBarTitleSection compact />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {isEditing ? <DeckDetailsTopBarEditActions compact /> : <DeckDetailsTopBarViewActions compact />}
      </div>
    </div>
  );
}

export function DeckDetailsTopBar() {
  return (
    <DeckDetailsTopBarProvider>
      <DeckDetailsTopBarInner />
    </DeckDetailsTopBarProvider>
  );
}
