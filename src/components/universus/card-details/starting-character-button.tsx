import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CachedCard } from "@/lib/universus/card-store";
import { useDeckEditor } from "@/lib/deck";
import { cn } from "@/lib/utils";

interface StartingCharacterButtonProps {
  card: CachedCard;
  className?: string;
  compact?: boolean;
}

export function StartingCharacterButton({ card, className, compact }: StartingCharacterButtonProps) {
  const { hasDeck, deck, updateDeck } = useDeckEditor();

  const isCharacter = card.type?.toLowerCase() === "character";
  if (!hasDeck || !isCharacter) return null;

  const isStartingCharacter = deck?.startingCharacterId === card._id;

  return (
    <Button
      variant={isStartingCharacter ? "default" : "outline"}
      size={compact ? "sm" : "default"}
      onClick={() =>
        updateDeck({
          startingCharacterId: isStartingCharacter ? null : card._id,
        })
      }
      className={cn(
        "gap-2 transition-colors",
        isStartingCharacter
          ? "bg-warning/20 text-warning border-warning/40 hover:bg-warning/30"
          : "border-warning/20 text-muted-foreground hover:text-warning hover:border-warning/40 hover:bg-warning/10",
        className
      )}
    >
      <Star className={cn("h-4 w-4", isStartingCharacter && "fill-warning")} />
      <span className="chrome-label-case text-xs">
        {compact
          ? isStartingCharacter ? "Starting" : "Set Starter"
          : isStartingCharacter ? "Starting Character" : "Set As Starting Character"
        }
      </span>
    </Button>
  );
}
