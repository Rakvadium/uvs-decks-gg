import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CachedCard } from "@/lib/universus/card-store";
import { parseKeywords, parseSymbols, splitKeywordGroups } from "./parsers";

type CardDetailsContentValue = {
  card: CachedCard;
  symbols: string[];
  showRarity: boolean;
  keywordAbilities: string[];
  otherKeywords: string[];
};

const CardDetailsContentContext = createContext<CardDetailsContentValue | null>(null);

interface CardDetailsContentProviderProps {
  card: CachedCard;
  children: ReactNode;
}

export function CardDetailsContentProvider({ card, children }: CardDetailsContentProviderProps) {
  const symbols = useMemo(() => parseSymbols(card.symbols), [card.symbols]);
  const keywords = useMemo(() => parseKeywords(card.keywords), [card.keywords]);
  const { keywordAbilities, otherKeywords } = useMemo(() => splitKeywordGroups(keywords), [keywords]);

  const value = useMemo(
    () => ({
      card,
      symbols,
      showRarity: Boolean(card.rarity && card.rarity.toLowerCase() !== card.type?.toLowerCase()),
      keywordAbilities,
      otherKeywords,
    }),
    [card, keywordAbilities, otherKeywords, symbols]
  );

  return <CardDetailsContentContext.Provider value={value}>{children}</CardDetailsContentContext.Provider>;
}

export function useCardDetailsContent() {
  const context = useContext(CardDetailsContentContext);

  if (!context) {
    throw new Error("useCardDetailsContent must be used within CardDetailsContentProvider");
  }

  return context;
}
