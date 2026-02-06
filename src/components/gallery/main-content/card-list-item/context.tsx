"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCardListItemModel, type CardListItemModel } from "./hook";
import type { CardListItemProps } from "./types";

const CardListItemContext = createContext<CardListItemModel | null>(null);

export function CardListItemProvider({ children, ...props }: CardListItemProps & { children: ReactNode }) {
  const value = useCardListItemModel(props);

  return <CardListItemContext.Provider value={value}>{children}</CardListItemContext.Provider>;
}

export function useCardListItemContext() {
  const context = useContext(CardListItemContext);

  if (!context) {
    throw new Error("useCardListItemContext must be used within CardListItemProvider");
  }

  return context;
}
