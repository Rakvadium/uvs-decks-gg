import { CardDeckControls } from "@/components/universus/card-item/deck-controls";
import { useCardGridItemContext } from "./context";

export function CardDeckActions() {
  const { hasDeck, isHovered, isMobile, deckCount, canAddToDeck, addToDeck, removeFromDeck } =
    useCardGridItemContext();

  if (!hasDeck) return null;

  return (
    <CardDeckControls
      deckCount={deckCount}
      isHovered={isHovered || isMobile}
      canAdd={canAddToDeck}
      onAdd={addToDeck}
      onRemove={removeFromDeck}
    />
  );
}
