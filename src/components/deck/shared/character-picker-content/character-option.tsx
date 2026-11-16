import { OptionTile } from "@/components/ui/option-tile";
import type { CachedCard } from "@/lib/universus/card-store";
import { CharacterThumbnail } from "./character-thumbnail";
import { useCharacterPickerContentContext } from "./context";

export function CharacterOption({ card }: { card: CachedCard }) {
  const { onSelectCharacter, selectedCharacterId, subtitleFor } = useCharacterPickerContentContext();

  return (
    <OptionTile
      variant="ghost"
      selected={card._id === selectedCharacterId}
      onClick={() => {
        void onSelectCharacter(card);
      }}
      className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
    >
      <CharacterThumbnail imageUrl={card.imageUrl} name={card.name} className="h-8 w-6" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{card.name}</p>
        <p className="chrome-label-case text-[10px] text-muted-foreground">{subtitleFor(card)}</p>
      </div>
    </OptionTile>
  );
}
