"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDeckDetailsListCardRowModel, type DeckDetailsListCardRowModel } from "./hook";
import type { DeckDetailsListCardRowProps } from "./types";

const DeckDetailsListCardRowContext = createContext<DeckDetailsListCardRowModel | null>(null);

export function DeckDetailsListCardRowProvider({
  children,
  ...props
}: DeckDetailsListCardRowProps & { children: ReactNode }) {
  const value = useDeckDetailsListCardRowModel(props);

  return <DeckDetailsListCardRowContext.Provider value={value}>{children}</DeckDetailsListCardRowContext.Provider>;
}

export function useDeckDetailsListCardRowContext() {
  const context = useContext(DeckDetailsListCardRowContext);

  if (!context) {
    throw new Error("useDeckDetailsListCardRowContext must be used within DeckDetailsListCardRowProvider");
  }

  return context;
}
