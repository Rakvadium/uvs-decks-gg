import { DeckGridItemMeta } from "./meta";
import { DeckGridItemStatusRow } from "./status-row";

export function DeckGridItemDetailsPanel() {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col p-3 sm:p-4">
      <div className="absolute bottom-0 right-0 top-0 w-px bg-gradient-to-b from-primary/20 via-transparent to-secondary/20 opacity-0 transition-opacity group-hover:opacity-100" />
      <DeckGridItemMeta />
      <DeckGridItemStatusRow />
    </div>
  );
}
