"use client";

import { useState } from "react";
import { Hexagon, Layers } from "lucide-react";
import type { GameDeckSetupPanelProps } from "@/games/types";
import { cn } from "@/lib/utils";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { CardDetailsDialog } from "../card-details/dialog";
import { CardImageDisplay } from "../card-grid-item/image-display";
import { DeckCharacterPickerDialog } from "../character-picker-dialog";
import { UvsChangeCharacterButton } from "./change-character-button";
import { useUvsSetupModel } from "./model";
import { UvsSetupSymbolSelector } from "./symbol-selector";

const HERO_IMAGE_SIZES = "(max-width: 1023px) 260px, 192px";

/** Deck details hero: starting character art (+ change button and identity selector for owners). */
export function UvsDeckSetupHero({
  setup,
  getCard,
  onChange,
  readOnly,
  coverCard,
  deckName,
  deckEmpty,
  overlay,
}: GameDeckSetupPanelProps) {
  const { startingCharacterId, startingCharacter, startingCharacterBack, selectedSymbol, characterSymbols } =
    useUvsSetupModel({ setup, getCard });
  const [characterOpen, setCharacterOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [characterDetailsOpen, setCharacterDetailsOpen] = useState(false);

  const displayImage = coverCard?.imageUrl || startingCharacter?.imageUrl;
  const compactEmptyMobile = Boolean(deckEmpty) && !displayImage;
  const editable = !readOnly && Boolean(onChange);

  const handleImageClick = () => {
    if (startingCharacter) {
      setCharacterDetailsOpen(true);
    }
  };

  const handleSelectCharacter = async (characterId: Id<"cards">) => {
    await onChange?.({ game: "uvs", startingCharacterId: characterId });
    setCharacterOpen(false);
  };

  const handleSelectSymbol = (symbol: string) => {
    void onChange?.({ game: "uvs", selectedIdentity: symbol });
    setSymbolOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "relative mx-auto w-full max-w-[260px] shrink-0 overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--primary)/15,0_0_8px_var(--primary)/30] lg:mx-0 lg:w-48",
          compactEmptyMobile ? "aspect-auto h-24 max-lg:max-w-none" : "aspect-[2.5/3.5]",
        )}
      >
        {editable ? (
          <>
            <button
              type="button"
              aria-label="View starting character details"
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={handleImageClick}
            >
              {displayImage ? (
                <CardImageDisplay
                  imageUrl={displayImage}
                  name={startingCharacter?.name ?? deckName ?? "Character"}
                  sizes={HERO_IMAGE_SIZES}
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <Hexagon
                      className={cn(
                        "text-primary/20",
                        compactEmptyMobile ? "h-12 w-12 max-lg:h-10 max-lg:w-10" : "h-20 w-20",
                      )}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Layers
                        className={cn(
                          "text-primary/40",
                          compactEmptyMobile ? "h-5 w-5 max-lg:h-4 max-lg:w-4" : "h-8 w-8",
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </button>

            <UvsChangeCharacterButton onClick={() => setCharacterOpen(true)} />

            <DeckCharacterPickerDialog
              open={characterOpen}
              onOpenChange={setCharacterOpen}
              selectedCharacterId={startingCharacterId}
              onSelectCharacter={handleSelectCharacter}
            />

            {startingCharacter ? (
              <UvsSetupSymbolSelector
                characterSymbols={characterSymbols}
                selectedSymbol={selectedSymbol}
                open={symbolOpen}
                onOpenChange={setSymbolOpen}
                onSelectSymbol={handleSelectSymbol}
              />
            ) : null}
          </>
        ) : (
          <button
            type="button"
            aria-label="View starting character details"
            className="absolute inset-0 z-10 cursor-pointer overflow-hidden"
            onClick={handleImageClick}
          >
            {displayImage ? (
              <CardImageDisplay
                imageUrl={displayImage}
                name={startingCharacter?.name ?? deckName ?? "Character"}
                sizes={HERO_IMAGE_SIZES}
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Hexagon className="h-20 w-20 text-primary/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Layers className="h-8 w-8 text-primary/40" />
                  </div>
                </div>
              </div>
            )}
          </button>
        )}
        {overlay}
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
