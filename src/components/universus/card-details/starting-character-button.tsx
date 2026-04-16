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
        "gap-2 transition-all",
        isStartingCharacter
          ? "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30"
          : "border-amber-500/20 text-muted-foreground hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10",
        className
      )}
    >
      <Star className={cn("h-4 w-4", isStartingCharacter && "fill-amber-400")} />
      <span className="text-xs font-mono uppercase tracking-wider">
        {compact
          ? isStartingCharacter ? "Starting" : "Set Starter"
          : isStartingCharacter ? "Starting Character" : "Set As Starting Character"
        }
      </span>
    </Button>
  );
}
