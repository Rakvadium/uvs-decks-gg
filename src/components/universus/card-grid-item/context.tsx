"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCardGridItem } from "./hook";
import type { CardGridItemProps } from "./types";

type CardGridItemContextValue = ReturnType<typeof useCardGridItem>;

const CardGridItemContext = createContext<CardGridItemContextValue | null>(null);

export function CardGridItemProvider({ children, ...props }: CardGridItemProps & { children: ReactNode }) {
  const value = useCardGridItem(props);

  return <CardGridItemContext.Provider value={value}>{children}</CardGridItemContext.Provider>;
}

export function useCardGridItemContext() {
  const context = useContext(CardGridItemContext);

  if (!context) {
    throw new Error("useCardGridItemContext must be used within CardGridItemProvider");
  }

  return context;
}
