"use client";

import { DeckDetailsView } from "@/components/deck-details";

export default function DeckDetailsPage() {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 md:h-full md:p-6">
      <DeckDetailsView />
    </div>
  );
}
