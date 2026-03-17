import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeckDetailsTopBarContext } from "./context";

interface DeckDetailsTopBarViewActionsProps {
  compact?: boolean;
}

export function DeckDetailsTopBarViewActions({ compact = false }: DeckDetailsTopBarViewActionsProps) {
  const { isActiveDeck, isOwner, setAsActiveDeck } = useDeckDetailsTopBarContext();

  if (!isOwner) return null;

  return (
    <Button
      variant={isActiveDeck ? "default" : "outline"}
      size={compact ? "icon" : "sm"}
      onClick={setAsActiveDeck}
      disabled={isActiveDeck}
      className={cn("h-8", compact && "w-8", isActiveDeck && "disabled:opacity-100")}
      aria-label={isActiveDeck ? "Active deck" : "Set as active deck"}
    >
      <Zap className={cn("h-4 w-4", !compact && "mr-1", isActiveDeck && "text-yellow-400")} />
      {!compact ? (isActiveDeck ? "Active" : "Set Active") : null}
    </Button>
  );
}
