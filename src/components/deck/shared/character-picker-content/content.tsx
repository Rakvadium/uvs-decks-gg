"use client";

import { CharacterList } from "./list";
import { CharacterPickerContentProvider } from "./context";
import { CharacterSearchInput } from "./search-input";
import { CurrentCharacterRow } from "./current-character";
import type { DeckCharacterPickerContentProps } from "./types";

function DeckCharacterPickerContentBody() {
  return (
    <div className="space-y-3">
      <CurrentCharacterRow />
      <CharacterSearchInput />
      <CharacterList />
    </div>
  );
}

export function DeckCharacterPickerContent(props: DeckCharacterPickerContentProps) {
  return (
    <CharacterPickerContentProvider {...props}>
      <DeckCharacterPickerContentBody />
    </CharacterPickerContentProvider>
  );
}
