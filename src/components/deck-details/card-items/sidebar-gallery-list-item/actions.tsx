import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarGalleryListItemContext } from "./context";

export function SidebarGalleryListItemActions() {
  const { addCard, canAddToMain, card, quantity, removeCard } = useSidebarGalleryListItemContext();

  return (
    <div className="flex items-center gap-1" data-no-drag onClick={(event) => event.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-7 w-7"
        onClick={() => removeCard(card._id, "main")}
        disabled={quantity <= 0}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-7 text-center font-mono text-[10px] text-primary">{quantity}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-7 w-7"
        onClick={() => addCard(card._id, "main")}
        disabled={!canAddToMain}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
