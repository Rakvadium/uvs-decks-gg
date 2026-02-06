import Image from "next/image";
import { Hexagon } from "lucide-react";
import { DeckCharacterPickerContent } from "@/components/deck/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useActiveDeckCharacterPanelContext } from "./context";

export function ActiveDeckCharacterPicker() {
  const {
    activeDeck,
    characterOpen,
    setCharacterOpen,
    startingCharacter,
    characterOptions,
    handleSelectCharacter,
    handleViewCharacterDetails,
  } = useActiveDeckCharacterPanelContext();

  return (
    <Popover open={characterOpen} onOpenChange={setCharacterOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Choose starting character"
          className={cn(
            "relative h-20 w-16 overflow-hidden rounded-md border border-border/40 bg-muted/40",
            "transition-all hover:border-primary/40 hover:shadow-[0_0_12px_-6px_var(--primary)]",
            !startingCharacter && "opacity-80"
          )}
        >
          {startingCharacter?.imageUrl ? (
            <Image src={startingCharacter.imageUrl} alt={startingCharacter.name} fill className="object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Hexagon className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3" align="start">
        <DeckCharacterPickerContent
          characters={characterOptions}
          selectedCharacterId={activeDeck?.startingCharacterId}
          currentCharacter={startingCharacter}
          onSelectCharacter={async (card) => {
            await handleSelectCharacter(card._id);
          }}
          onViewDetails={handleViewCharacterDetails}
          getCharacterSubtitle={(card) => card.setName ?? card.setCode ?? "Character"}
        />
      </PopoverContent>
    </Popover>
  );
}
