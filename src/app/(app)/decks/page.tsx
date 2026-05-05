"use client";

import { DecksView } from "@/components/decks";

export default function DecksPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:h-full md:p-6">
      <DecksView />
    </div>
  );
}
