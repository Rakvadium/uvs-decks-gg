"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCollectionViewModel, type CollectionViewModel } from "./hook";

const CollectionViewContext = createContext<CollectionViewModel | null>(null);

export function CollectionViewProvider({ children }: { children: ReactNode }) {
  const value = useCollectionViewModel();
  return <CollectionViewContext.Provider value={value}>{children}</CollectionViewContext.Provider>;
}

export function useCollectionViewContext() {
  const context = useContext(CollectionViewContext);

  if (!context) {
    throw new Error("useCollectionViewContext must be used within CollectionViewProvider");
  }

  return context;
}
