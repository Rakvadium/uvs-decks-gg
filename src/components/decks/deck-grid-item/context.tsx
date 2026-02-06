"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDeckGridItemModel, type DeckGridItemModel } from "./hook";
import type { DeckGridItemProps } from "./types";

const DeckGridItemContext = createContext<DeckGridItemModel | null>(null);

export function DeckGridItemProvider({ children, ...props }: DeckGridItemProps & { children: ReactNode }) {
  const model = useDeckGridItemModel(props);

  return <DeckGridItemContext.Provider value={model}>{children}</DeckGridItemContext.Provider>;
}

export function useDeckGridItemContext() {
  const context = useContext(DeckGridItemContext);

  if (!context) {
    throw new Error("useDeckGridItemContext must be used within DeckGridItemProvider");
  }

  return context;
}
