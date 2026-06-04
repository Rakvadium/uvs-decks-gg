import Image from "next/image";
import { Hexagon, Layers, UserRoundPen } from "lucide-react";
import { DeckCharacterPickerDialog } from "@/components/deck/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useActiveDeckCharacterPanelContext } from "./context";

export function ActiveDeckCharacterPicker() {
  const {
    activeDeck,
    characterOpen,
    setCharacterOpen,
    startingCharacter,
    handleSelectCharacter,
    handleImageClick,
  } = useActiveDeckCharacterPanelContext();

  return (
    <>
      <div
        className={cn(
          "relative h-full min-h-[108px] w-[86px] overflow-hidden rounded-none border-0 border-r border-border/40 bg-muted/40",
          "transition-all hover:border-r-primary/40 hover:shadow-[0_0_14px_-8px_var(--primary)]",
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
                "transition-all hover:bg-primary/10 hover:border-primary/40"
              )}
            >
              <UserRoundPen className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-mono text-xs uppercase tracking-wider">
            <p>Change Character</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <DeckCharacterPickerDialog
        open={characterOpen}
        onOpenChange={setCharacterOpen}
        selectedCharacterId={activeDeck?.startingCharacterId}
        onSelectCharacter={handleSelectCharacter}
      />
    </>
  );
}
