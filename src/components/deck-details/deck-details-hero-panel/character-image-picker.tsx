import Image from "next/image";
import { Hexagon, Layers, UserRoundPen } from "lucide-react";
import { DeckCharacterPickerDialog } from "@/components/deck/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDeckDetailsHeroPanelContext } from "./context";

export function DeckDetailsHeroCharacterImagePicker() {
  const {
    characterOpen,
    setCharacterOpen,
    deck,
    imageCard,
    startingCharacter,
    compactEmptyMobile,
    handleSelectCharacter,
    handleImageClick,
  } = useDeckDetailsHeroPanelContext();

  if (!deck) return null;

  const displayImage = imageCard?.imageUrl || startingCharacter?.imageUrl;

  return (
    <>
      <button
        type="button"
        aria-label="View starting character details"
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleImageClick}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={deck.name}
            fill
            sizes="(max-width: 1023px) 260px, 192px"
            className="object-cover object-top"
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

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Change starting character"
            onClick={(event) => {
              event.stopPropagation();
              setCharacterOpen(true);
            }}
            className={cn(
              "absolute right-0 top-0 z-20 flex h-8 w-8 items-center justify-center",
              "rounded-tr-lg rounded-bl-lg rounded-tl-none rounded-br-none",
              "bg-background/80 backdrop-blur-sm",
              "border-l border-b border-border/40",
              "transition-colors hover:bg-primary/10 hover:border-primary/40"
            )}
          >
            <UserRoundPen className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="chrome-label-case text-xs">
          <p>Change Character</p>
        </TooltipContent>
      </Tooltip>

      <DeckCharacterPickerDialog
        open={characterOpen}
        onOpenChange={setCharacterOpen}
        selectedCharacterId={deck.startingCharacterId}
        onSelectCharacter={handleSelectCharacter}
      />
    </>
  );
}
