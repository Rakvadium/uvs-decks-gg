import Image from "next/image";
import { Hexagon, Layers } from "lucide-react";
import { DeckCharacterPickerContent } from "@/components/deck/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDeckDetailsHeroPanelContext } from "./context";

export function DeckDetailsHeroCharacterImagePicker() {
  const {
    characterOpen,
    setCharacterOpen,
    characterOptions,
    deck,
    imageCard,
    startingCharacter,
    handleSelectCharacter,
    handleViewCharacterDetails,
  } = useDeckDetailsHeroPanelContext();

  if (!deck) return null;

  const displayImage = imageCard?.imageUrl || startingCharacter?.imageUrl;

  return (
    <Popover open={characterOpen} onOpenChange={setCharacterOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Choose starting character" className="absolute inset-0 z-10">
          {displayImage ? (
            <>
              <Image src={displayImage} alt={deck.name} fill className="object-cover object-top" />
            </>
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
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <DeckCharacterPickerContent
          characters={characterOptions}
          selectedCharacterId={deck.startingCharacterId}
          currentCharacter={startingCharacter}
          onSelectCharacter={async (card) => {
            await handleSelectCharacter(card._id);
          }}
          onViewDetails={handleViewCharacterDetails}
        />
      </PopoverContent>
    </Popover>
  );
}
