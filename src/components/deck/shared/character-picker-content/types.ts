import type { CachedCard } from "@/lib/universus/card-store";

export interface DeckCharacterPickerContentProps {
  characters: CachedCard[];
  selectedCharacterId?: string | null;
  currentCharacter: CachedCard | null;
  onSelectCharacter: (card: CachedCard) => void | Promise<void>;
  onViewDetails?: () => void;
  getCharacterSubtitle?: (card: CachedCard) => string;
}
