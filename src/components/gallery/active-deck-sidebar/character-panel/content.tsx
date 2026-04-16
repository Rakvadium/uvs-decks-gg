"use client";

import { CardDetailsDialog } from "@/components/universus/card-details/dialog";
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
      <div className="overflow-hidden rounded-lg border border-border/50 bg-card/40">
        <div className="flex items-stretch justify-between">
          <div className="min-w-0 flex flex-1 items-stretch">
            <div className="relative">
              <ActiveDeckCharacterPicker />
              <ActiveDeckCharacterSymbolSelector />
            </div>

            <div className="min-w-0 flex-1 p-3">
              <ActiveDeckCharacterSummary />
            </div>
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
