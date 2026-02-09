import { Edit3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeckDetailsTopBarContext } from "./context";
import { DeckDetailsTopBarDeleteAction } from "./delete-action";

interface DeckDetailsTopBarViewActionsProps {
  compact?: boolean;
}

export function DeckDetailsTopBarViewActions({ compact = false }: DeckDetailsTopBarViewActionsProps) {
  const { isActiveDeck, setAsActiveDeck, startEditing } = useDeckDetailsTopBarContext();

  return (
    <>
      <Button
        variant={isActiveDeck ? "default" : "outline"}
        size="sm"
        onClick={setAsActiveDeck}
        disabled={isActiveDeck}
        className={cn("h-8", compact && "gap-1 px-2 text-xs")}
      >
        <Zap className={cn("mr-1 h-4 w-4", isActiveDeck && "text-yellow-400")} />
        {isActiveDeck ? "Active" : "Set Active"}
      </Button>

      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        onClick={startEditing}
        className={cn("h-8", compact && "w-8")}
        aria-label="Edit deck metadata"
      >
        <Edit3 className={cn("h-4 w-4", !compact && "mr-1")} />
        {!compact ? "Edit" : null}
      </Button>

      <DeckDetailsTopBarDeleteAction compact={compact} />
    </>
  );
}
