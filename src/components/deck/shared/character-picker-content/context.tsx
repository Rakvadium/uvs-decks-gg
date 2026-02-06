"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCharacterPickerContentModel, type CharacterPickerContentModel } from "./hook";
import type { DeckCharacterPickerContentProps } from "./types";

const CharacterPickerContentContext = createContext<CharacterPickerContentModel | null>(null);

export function CharacterPickerContentProvider({
  children,
  ...props
}: DeckCharacterPickerContentProps & { children: ReactNode }) {
  const value = useCharacterPickerContentModel(props);

  return <CharacterPickerContentContext.Provider value={value}>{children}</CharacterPickerContentContext.Provider>;
}

export function useCharacterPickerContentContext() {
  const context = useContext(CharacterPickerContentContext);

  if (!context) {
    throw new Error("useCharacterPickerContentContext must be used within CharacterPickerContentProvider");
  }

  return context;
}
