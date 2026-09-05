"use client";

import { DeckCreateDialog } from "./create-dialog";
import { DecksViewContent } from "./content";
import { DecksViewHeading } from "./heading";
import { DecksMobileScopeControl } from "./mobile-bottom-tools";
import { DecksMobilePeekSlots } from "./mobile-peek-slots";

export function DecksView() {
  return (
    <div className="space-y-4 md:space-y-6">
      <DecksMobilePeekSlots />
      <DecksViewHeading />
      <DecksMobileScopeControl />

      <DeckCreateDialog />
      <DecksViewContent />
    </div>
  );
}
