"use client";

import { TeamsDecksIndexContent } from "@/components/teams/teams-decks/content";

export default function TeamsDecksPage() {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden md:h-full">
      <TeamsDecksIndexContent />
    </div>
  );
}
