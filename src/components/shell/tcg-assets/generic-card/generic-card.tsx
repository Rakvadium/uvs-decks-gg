import { GenericCardProvider } from "./context";
import { CardVariant } from "./card-variant";
import { InlineVariant } from "./inline-variant";
import { ListVariant } from "./list-variant";
import type { GenericCardProps } from "./types";

export function GenericCard({
  className,
  variant = "card",
  cardData,
  deckCount = 0,
  onAddToDeck,
  onRemoveFromDeck,
  onCardClick,
  showFlipButton = false,
  onFlip,
  renderDetails,
  ...props
}: GenericCardProps) {
  return (
    <GenericCardProvider
      cardData={cardData}
      deckCount={deckCount}
      onAddToDeck={onAddToDeck}
      onRemoveFromDeck={onRemoveFromDeck}
      showFlipButton={showFlipButton}
      onFlip={onFlip}
      renderDetails={renderDetails}
    >
      {variant === "list" ? (
        <ListVariant className={className} {...props} />
      ) : variant === "inline" ? (
        <InlineVariant className={className} {...props} />
      ) : (
        <CardVariant className={className} onCardClick={onCardClick} {...props} />
      )}
    </GenericCardProvider>
  );
}
