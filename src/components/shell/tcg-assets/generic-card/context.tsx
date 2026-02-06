import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CardData, CardDetailsRendererProps } from "./types";

interface GenericCardContextValue {
  cardData: CardData;
  deckCount: number;
  onAddToDeck?: (cardId: string) => void;
  onRemoveFromDeck?: (cardId: string) => void;
  showFlipButton: boolean;
  onFlip?: () => void;
  renderDetails?: (props: CardDetailsRendererProps) => React.ReactNode;
}

const GenericCardContext = createContext<GenericCardContextValue | null>(null);

interface GenericCardProviderProps {
  cardData: CardData;
  deckCount: number;
  onAddToDeck?: (cardId: string) => void;
  onRemoveFromDeck?: (cardId: string) => void;
  showFlipButton: boolean;
  onFlip?: () => void;
  renderDetails?: (props: CardDetailsRendererProps) => React.ReactNode;
  children: ReactNode;
}

export function GenericCardProvider({
  cardData,
  deckCount,
  onAddToDeck,
  onRemoveFromDeck,
  showFlipButton,
  onFlip,
  renderDetails,
  children,
}: GenericCardProviderProps) {
  const value = useMemo(
    () => ({
      cardData,
      deckCount,
      onAddToDeck,
      onRemoveFromDeck,
      showFlipButton,
      onFlip,
      renderDetails,
    }),
    [cardData, deckCount, onAddToDeck, onRemoveFromDeck, showFlipButton, onFlip, renderDetails]
  );

  return <GenericCardContext.Provider value={value}>{children}</GenericCardContext.Provider>;
}

export function useGenericCardContext() {
  const context = useContext(GenericCardContext);

  if (!context) {
    throw new Error("useGenericCardContext must be used within GenericCardProvider");
  }

  return context;
}
