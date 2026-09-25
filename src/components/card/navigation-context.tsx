"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CachedCard } from "@/lib/universus/card-store";

type CardNavigationValue = {
  cards: CachedCard[];
  getBackCard: (card: CachedCard) => CachedCard | null | undefined;
};

const CardNavigationContext = createContext<CardNavigationValue | null>(null);

interface CardNavigationProviderProps {
  cards: CachedCard[];
  getBackCard: (card: CachedCard) => CachedCard | null | undefined;
  children: ReactNode;
}

export function CardNavigationProvider({ cards, getBackCard, children }: CardNavigationProviderProps) {
  return (
    <CardNavigationContext.Provider value={{ cards, getBackCard }}>
      {children}
    </CardNavigationContext.Provider>
  );
}

export function useCardNavigation() {
  return useContext(CardNavigationContext);
}
