"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDeckCardsSectionModel, type DeckCardsSectionModel } from "./deck-details-cards-section-model";

const DeckCardsSectionContext = createContext<DeckCardsSectionModel | null>(null);

export function DeckCardsSectionProvider({ children }: { children: ReactNode }) {
  const value = useDeckCardsSectionModel();

  return <DeckCardsSectionContext.Provider value={value}>{children}</DeckCardsSectionContext.Provider>;
}

export function useDeckCardsSectionContext() {
  const context = useContext(DeckCardsSectionContext);

  if (!context) {
    throw new Error("useDeckCardsSectionContext must be used within DeckCardsSectionProvider");
  }

  return context;
}
