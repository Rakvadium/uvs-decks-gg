"use client";

import { useState } from "react";
import Image from "next/image";
import { Hexagon, Layers } from "lucide-react";
import type { GameDeckSetupPanelProps } from "@/games/types";
import { cn } from "@/lib/utils";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { CardDetailsDialog } from "../card-details/dialog";
import { DeckCharacterPickerDialog } from "../character-picker-dialog";
import { UvsChangeCharacterButton } from "./change-character-button";
import { useUvsSetupModel } from "./model";
import { UvsSetupSymbolSelector } from "./symbol-selector";

/** Gallery active-deck panel: character art, change/identity controls, name and deck description. */
export function UvsDeckSetupSidebar({ setup, getCard, onChange, readOnly, deckDescription }: GameDeckSetupPanelProps) {
  const { startingCharacterId, startingCharacter, startingCharacterBack, selectedSymbol, characterSymbols } =
    useUvsSetupModel({ setup, getCard });
  const [characterOpen, setCharacterOpen] = useState(false);
  const [characterDetailsOpen, setCharacterDetailsOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const editable = !readOnly && Boolean(onChange);

  const displayName = startingCharacter?.name ?? "Select a starting character";
  const commaIndex = displayName.indexOf(",");
  const primaryName = commaIndex >= 0 ? displayName.slice(0, commaIndex + 1) : displayName;
  const subtitleName = commaIndex >= 0 ? displayName.slice(commaIndex + 1).trim() : "";

  const handleSelectCharacter = async (cardId: Id<"cards">) => {
    await onChange?.({ game: "uvs", startingCharacterId: cardId });
  };

  const handleSelectSymbol = (symbol: string) => {
    void onChange?.({ game: "uvs", selectedIdentity: symbol });
    setSymbolOpen(false);
  };

  const handleImageClick = () => {
    if (startingCharacter) {
      setCharacterDetailsOpen(true);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border/50 bg-card/50">
        <div className="flex items-stretch justify-between">
          <div className="min-w-0 flex flex-1 items-stretch">
            <div className="relative">
              <div
                className={cn(
                  "relative h-full min-h-[108px] w-[86px] overflow-hidden rounded-none border-0 border-r border-border/40 bg-muted/50",
                  "transition-colors hover:border-r-primary/40 hover:shadow-[0_0_14px_-8px_var(--primary)]",
                  !startingCharacter && "opacity-80"
                )}
              >
                <button
                  type="button"
                  aria-label="View starting character details"
                  className="absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0"
                  onClick={handleImageClick}
                >
                  {startingCharacter?.imageUrl ? (
                    <Image
                      src={startingCharacter.imageUrl}
                      alt={startingCharacter.name}
                      fill
                      sizes="86px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <Hexagon className="h-10 w-10 text-primary/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Layers className="h-4 w-4 text-primary/40" />
                        </div>
                      </div>
                    </div>
                  )}
                </button>

                {editable ? <UvsChangeCharacterButton onClick={() => setCharacterOpen(true)} /> : null}
              </div>

              {editable ? (
                <DeckCharacterPickerDialog
                  open={characterOpen}
                  onOpenChange={setCharacterOpen}
                  selectedCharacterId={startingCharacterId}
                  onSelectCharacter={handleSelectCharacter}
                />
              ) : null}

              {editable && startingCharacter ? (
                <UvsSetupSymbolSelector
                  characterSymbols={characterSymbols}
                  selectedSymbol={selectedSymbol}
                  open={symbolOpen}
                  onOpenChange={setSymbolOpen}
                  onSelectSymbol={handleSelectSymbol}
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1 p-3">
              <div className="min-w-0 space-y-1">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-base font-semibold tracking-wide">
                    {primaryName}
                  </p>
                  {subtitleName ? (
                    <p className="chrome-label-case line-clamp-1 text-[10px] text-muted-foreground">
                      {subtitleName}
                    </p>
                  ) : null}
                </div>
                <p className="chrome-label-case line-clamp-2 text-[10px] text-muted-foreground">
                  {deckDescription?.trim() ? deckDescription : "No description yet."}
                </p>
              </div>
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
