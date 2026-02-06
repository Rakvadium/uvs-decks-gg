"use client";

import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { DeckCreateDialog } from "./create-dialog";
import { DecksViewContent } from "./content";
import { DecksViewHeading } from "./heading";
import { DecksTopBar } from "./top-bar";

export function DecksView() {
  useRegisterSlot("top-bar", "decks-filters", DecksTopBar);

  return (
    <div className="space-y-6">
      <DecksViewHeading />
      <DeckCreateDialog />
      <DecksViewContent />
    </div>
  );
}
