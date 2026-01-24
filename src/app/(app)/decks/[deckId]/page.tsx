"use client";

import { useParams } from "next/navigation";
import { DeckDetailsView } from "@/components/deck-details";

export default function DeckDetailsPage() {
  const params = useParams();
  const deckId = params?.deckId as string;

  if (!deckId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Deck not found</p>
      </div>
    );
  }

  return (
    <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden p-6">
      <DeckDetailsView deckId={deckId} />
    </div>
  );
}
