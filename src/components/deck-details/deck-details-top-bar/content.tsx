"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DeckDetailsTopBarProvider, useDeckDetailsTopBarContext } from "./context";
import { DeckDetailsTopBarEditActions } from "./edit-actions";
import { DeckDetailsTopBarLoadingState } from "./loading-state";
import { DeckDetailsTopBarTitleSection } from "./title-section";
import { DeckDetailsTopBarViewActions } from "./view-actions";

function DeckDetailsTopBarContent() {
  const { deck, isEditing, isLoading } = useDeckDetailsTopBarContext();
  const isMobile = useIsMobile();

  if (isLoading || !deck) {
    return <DeckDetailsTopBarLoadingState />;
  }

  if (isMobile) {
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

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <Link href="/decks">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      <DeckDetailsTopBarTitleSection />

      <div className="ml-auto flex items-center gap-2">
        {isEditing ? <DeckDetailsTopBarEditActions /> : <DeckDetailsTopBarViewActions />}
      </div>
    </div>
  );
}

export function DeckDetailsTopBar() {
  return (
    <DeckDetailsTopBarProvider>
      <DeckDetailsTopBarContent />
    </DeckDetailsTopBarProvider>
  );
}
