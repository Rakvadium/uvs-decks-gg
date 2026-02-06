import { CharacterOption } from "./character-option";
import { useCharacterPickerContentContext } from "./context";

export function CharacterList() {
  const { filteredCharacters } = useCharacterPickerContentContext();

  return (
    <div className="max-h-60 space-y-1 overflow-y-auto">
      {filteredCharacters.map((card) => (
        <CharacterOption key={card._id} card={card} />
      ))}

      {filteredCharacters.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/50 p-3 text-xs text-muted-foreground">
          No characters found.
        </div>
      ) : null}
    </div>
  );
}
