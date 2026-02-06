import { cn } from "@/lib/utils";
import type { CachedCard } from "@/lib/universus";
import { CharacterThumbnail } from "./character-thumbnail";
import { useCharacterPickerContentContext } from "./context";

export function CharacterOption({ card }: { card: CachedCard }) {
  const { onSelectCharacter, selectedCharacterId, subtitleFor } = useCharacterPickerContentContext();

  return (
    <button
      type="button"
      onClick={() => {
        void onSelectCharacter(card);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left hover:border-primary/40 hover:bg-primary/5",
        card._id === selectedCharacterId && "border-primary/40 bg-primary/10"
      )}
    >
      <CharacterThumbnail imageUrl={card.imageUrl} name={card.name} className="h-8 w-6" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{card.name}</p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{subtitleFor(card)}</p>
      </div>
    </button>
  );
}
