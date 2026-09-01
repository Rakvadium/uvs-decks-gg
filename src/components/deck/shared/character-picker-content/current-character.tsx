import { Button } from "@/components/ui/button";
import { CharacterThumbnail } from "./character-thumbnail";
import { useCharacterPickerContentContext } from "./context";

export function CurrentCharacterRow() {
  const { currentCharacter, onViewDetails, subtitleFor } = useCharacterPickerContentContext();

  if (!currentCharacter) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-card/50 px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <CharacterThumbnail imageUrl={currentCharacter.imageUrl} name={currentCharacter.name} className="h-9 w-7" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{currentCharacter.name}</p>
          <p className="chrome-label-case text-[10px] text-muted-foreground">
            {subtitleFor(currentCharacter)}
          </p>
        </div>
      </div>
      {onViewDetails ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px]"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      ) : null}
    </div>
  );
}
