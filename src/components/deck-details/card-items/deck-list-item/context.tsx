"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDeckListItemModel, type DeckListItemModel } from "./hook";
import type { DeckListItemProps } from "./types";

const DeckListItemContext = createContext<DeckListItemModel | null>(null);

export function DeckListItemProvider({ children, ...props }: DeckListItemProps & { children: ReactNode }) {
  const value = useDeckListItemModel(props);

  return <DeckListItemContext.Provider value={value}>{children}</DeckListItemContext.Provider>;
}

export function useDeckListItemContext() {
  const context = useContext(DeckListItemContext);

  if (!context) {
    throw new Error("useDeckListItemContext must be used within DeckListItemProvider");
  }

  return context;
}
