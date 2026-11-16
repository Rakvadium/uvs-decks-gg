import { CharacterOption } from "./character-option";
import { EmptyState } from "@/components/ui/empty-state";
import { useCharacterPickerContentContext } from "./context";

export function CharacterList() {
  const { filteredCharacters } = useCharacterPickerContentContext();

  return (
    <div className="max-h-60 space-y-1 overflow-y-auto">
      {filteredCharacters.map((card) => (
        <CharacterOption key={card._id} card={card} />
      ))}

      {filteredCharacters.length === 0 ? (
        <EmptyState variant="inline" title="No characters found." />
      ) : null}
    </div>
  );
}
