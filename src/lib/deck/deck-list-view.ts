/** Client-side ordering and format filtering for the Decks page list. */
export type DeckListSort = "default" | "newest" | "oldest" | "name" | "cards";

export const DECK_LIST_SORT_OPTIONS: Array<{ value: DeckListSort; label: string }> = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
  { value: "cards", label: "Most cards" },
];

interface DeckListEntry {
  name: string;
  format?: string;
  _creationTime: number;
  mainQuantities: Record<string, number>;
}

function mainCardCount(deck: DeckListEntry) {
  let total = 0;
  for (const quantity of Object.values(deck.mainQuantities)) total += quantity;
  return total;
}

export function deckFormatOptions(decks: DeckListEntry[]): string[] {
  const formats = new Set<string>();
  for (const deck of decks) {
    if (deck.format) formats.add(deck.format);
  }
  return [...formats].sort((a, b) => a.localeCompare(b));
}

export function formatDeckFormatLabel(format: string) {
  return format
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function applyDeckListView<T extends DeckListEntry>(decks: T[], sort: DeckListSort, format: string | null): T[] {
  const filtered = format ? decks.filter((deck) => deck.format === format) : decks;
  if (sort === "default") return filtered;

  const sorted = [...filtered];
  if (sort === "newest") sorted.sort((a, b) => b._creationTime - a._creationTime);
  if (sort === "oldest") sorted.sort((a, b) => a._creationTime - b._creationTime);
  if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "cards") sorted.sort((a, b) => mainCardCount(b) - mainCardCount(a));
  return sorted;
}
