import { Input } from "@/components/ui/input";
import { useCharacterPickerContentContext } from "./context";

export function CharacterSearchInput() {
  const { query, setQuery } = useCharacterPickerContentContext();

  return (
    <Input
      placeholder="Search characters..."
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      className="h-8"
    />
  );
}
