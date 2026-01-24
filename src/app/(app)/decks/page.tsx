"use client";

import { DecksView } from "@/components/decks";

export default function DecksPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <DecksView />
    </div>
  );
}
