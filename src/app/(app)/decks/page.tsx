"use client";

import { DecksView } from "@/components/decks";

export default function DecksPage() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 md:p-6">
      <DecksView />
    </div>
  );
}
