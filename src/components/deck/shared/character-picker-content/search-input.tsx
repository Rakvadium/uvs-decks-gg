import { SearchField } from "@/components/ui/search-field";
import { useCharacterPickerContentContext } from "./context";

export function CharacterSearchInput() {
  const { query, setQuery } = useCharacterPickerContentContext();

  return <SearchField placeholder="Search characters..." value={query} onValueChange={setQuery} name="character-search" />;
}
