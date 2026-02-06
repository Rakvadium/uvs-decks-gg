import type React from "react";

export type CardVariant = "card" | "list" | "inline";

export interface CardData {
  id: string;
  name: string;
  imageSrc: string;
  type: string;
  rarity: string;
  description: string;
  attack?: number;
  defense?: number;
  cost?: number;
}

export interface CardDetailsRendererProps {
  cardData: CardData;
  deckCount: number;
  onAddToDeck?: (cardId: string) => void;
  onRemoveFromDeck?: (cardId: string) => void;
}

export type GenericCardProps = React.ComponentProps<"div"> & {
  variant?: CardVariant;
  cardData: CardData;
  deckCount?: number;
  onAddToDeck?: (cardId: string) => void;
  onRemoveFromDeck?: (cardId: string) => void;
  onCardClick?: (cardData: CardData) => void;
  showFlipButton?: boolean;
  onFlip?: () => void;
  renderDetails?: (props: CardDetailsRendererProps) => React.ReactNode;
};
