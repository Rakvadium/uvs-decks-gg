import { Edit3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeckDetailsTopBarContext } from "./context";
import { DeckDetailsTopBarDeleteAction } from "./delete-action";

export function DeckDetailsTopBarViewActions() {
  const { isActiveDeck, setAsActiveDeck, startEditing } = useDeckDetailsTopBarContext();

  return (
    <>
      <Button
        variant={isActiveDeck ? "default" : "outline"}
        size="sm"
        onClick={setAsActiveDeck}
        disabled={isActiveDeck}
        className="h-8"
      >
        <Zap className={cn("mr-1 h-4 w-4", isActiveDeck && "text-yellow-400")} />
        {isActiveDeck ? "Active" : "Set Active"}
      </Button>

      <Button variant="outline" size="sm" onClick={startEditing} className="h-8">
        <Edit3 className="mr-1 h-4 w-4" />
        Edit
      </Button>

      <DeckDetailsTopBarDeleteAction />
    </>
  );
}
