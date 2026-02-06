import { useActiveDeckCharacterPanelContext } from "./context";

export function ActiveDeckCharacterSummary() {
  const { activeDeck, startingCharacter } = useActiveDeckCharacterPanelContext();
  const displayName = startingCharacter?.name ?? "Select a starting character";
  const commaIndex = displayName.indexOf(",");
  const primaryName = commaIndex >= 0 ? displayName.slice(0, commaIndex + 1) : displayName;
  const subtitleName = commaIndex >= 0 ? displayName.slice(commaIndex + 1).trim() : "";

  return (
    <div className="min-w-0 space-y-1">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-display text-base font-semibold tracking-wide">
          {primaryName}
        </p>
        {subtitleName ? (
          <p className="line-clamp-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {subtitleName}
          </p>
        ) : null}
      </div>
      <p className="line-clamp-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {activeDeck?.description?.trim() ? activeDeck.description : "No description yet."}
      </p>
    </div>
  );
}
