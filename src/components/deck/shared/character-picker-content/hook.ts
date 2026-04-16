import { useCallback, useMemo, useState } from "react";
import type { CachedCard } from "@/lib/universus/card-store";
import type { DeckCharacterPickerContentProps } from "./types";

export function useCharacterPickerContentModel({
  characters,
  currentCharacter,
  getCharacterSubtitle,
  onSelectCharacter,
  onViewDetails,
  selectedCharacterId,
}: DeckCharacterPickerContentProps) {
  const [query, setQuery] = useState("");

  const filteredCharacters = useMemo(() => {
    if (!query.trim()) return characters;

    const lowered = query.toLowerCase();
    return characters.filter((card) => card.name.toLowerCase().includes(lowered));
  }, [characters, query]);

  const subtitleFor = useCallback(
    (card: CachedCard) => {
      return getCharacterSubtitle?.(card) ?? card.setName ?? card.setCode ?? "Character";
    },
    [getCharacterSubtitle]
  );

  return {
    query,
    setQuery,
    currentCharacter,
    selectedCharacterId,
    onSelectCharacter,
    onViewDetails,
    filteredCharacters,
    subtitleFor,
  };
}

export type CharacterPickerContentModel = ReturnType<typeof useCharacterPickerContentModel>;
