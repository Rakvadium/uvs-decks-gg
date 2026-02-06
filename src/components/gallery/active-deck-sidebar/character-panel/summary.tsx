import { useActiveDeckCharacterPanelContext } from "./context";

export function ActiveDeckCharacterSummary() {
  const { activeDeck, startingCharacter } = useActiveDeckCharacterPanelContext();

  return (
    <div className="min-w-0 space-y-1">
      <div className="min-w-0 flex items-center gap-2">
        <p className="line-clamp-2 flex-1 truncate text-sm font-medium">
          {startingCharacter?.name ?? "Select a starting character"}
        </p>
      </div>
      <p className="line-clamp-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {activeDeck?.description?.trim() ? activeDeck.description : "No description yet."}
      </p>
    </div>
  );
}
