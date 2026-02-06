"use client";

import { CardDetailsDialog } from "@/components/universus";
import { ActiveDeckCharacterPanelProvider, useActiveDeckCharacterPanelContext } from "./context";
import { ActiveDeckCharacterPicker } from "./character-picker";
import { ActiveDeckCharacterSummary } from "./summary";
import { ActiveDeckCharacterSymbolSelector } from "./symbol-selector";

function ActiveDeckCharacterPanelContent() {
  const {
    characterDetailsOpen,
    setCharacterDetailsOpen,
    startingCharacter,
    startingCharacterBack,
  } = useActiveDeckCharacterPanelContext();

  return (
    <>
      <div className="space-y-3 rounded-lg border border-border/50 bg-card/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-3">
            <div className="relative">
              <ActiveDeckCharacterPicker />
              <ActiveDeckCharacterSymbolSelector />
            </div>

            <ActiveDeckCharacterSummary />
          </div>
        </div>
      </div>

      <CardDetailsDialog
        card={startingCharacter}
        backCard={startingCharacterBack}
        open={characterDetailsOpen}
        onOpenChange={setCharacterDetailsOpen}
      />
    </>
  );
}

export function ActiveDeckCharacterPanel() {
  return (
    <ActiveDeckCharacterPanelProvider>
      <ActiveDeckCharacterPanelContent />
    </ActiveDeckCharacterPanelProvider>
  );
}
