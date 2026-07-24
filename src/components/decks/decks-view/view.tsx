"use client";

import { DeckCreateDialog } from "./create-dialog";
import { DecksViewContent } from "./content";
import { DecksViewHeading } from "./heading";

export function DecksView() {
  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <DecksViewHeading />
      </div>

      <DeckCreateDialog />
      <DecksViewContent />
    </div>
  );
}
