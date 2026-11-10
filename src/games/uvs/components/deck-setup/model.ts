import { useMemo } from "react";
import { uvsSetupFields } from "@shared/games/uvs/setup";
import type { GameDeckSetupPanelProps } from "@/games/types";

/** Unique lowercase identity symbols of a starting character (`"fire|Chaos"` → `["fire", "chaos"]`). */
export function splitCharacterSymbols(symbols: string | undefined): string[] {
  if (!symbols) return [];
  return [
    ...new Set(
      symbols
        .split(/[,|]/)
        .map((symbol) => symbol.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

/** Starting character + identity derived from a UVS setup (shared by the hero and sidebar panels). */
export function useUvsSetupModel({ setup, getCard }: Pick<GameDeckSetupPanelProps, "setup" | "getCard">) {
  const fields = uvsSetupFields(setup);
  const startingCharacter = fields.startingCharacterId ? getCard(fields.startingCharacterId) ?? null : null;
  const startingCharacterBack = startingCharacter?.backCardId ? getCard(startingCharacter.backCardId) ?? null : null;
  const selectedSymbol = fields.selectedIdentity ? fields.selectedIdentity.toLowerCase() : null;
  const startingCharacterSymbols = startingCharacter?.symbols;
  const characterSymbols = useMemo(() => splitCharacterSymbols(startingCharacterSymbols), [startingCharacterSymbols]);

  return {
    startingCharacterId: fields.startingCharacterId,
    startingCharacter,
    startingCharacterBack,
    selectedSymbol,
    characterSymbols,
  };
}
