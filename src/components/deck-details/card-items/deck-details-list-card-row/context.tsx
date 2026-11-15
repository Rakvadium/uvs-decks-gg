"use client";

import { createContext, useContext } from "react";
import type { DeckCardRowModel } from "./types";

const DeckCardRowContext = createContext<DeckCardRowModel | null>(null);

export const DeckCardRowProvider = DeckCardRowContext.Provider;

export function useDeckCardRowContext() {
  const context = useContext(DeckCardRowContext);

  if (!context) {
    throw new Error("useDeckCardRowContext must be used within DeckCardRowProvider");
  }

  return context;
}
