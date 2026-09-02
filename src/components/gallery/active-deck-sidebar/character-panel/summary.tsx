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
        <p className="truncate text-base font-semibold tracking-wide">
          {primaryName}
        </p>
        {subtitleName ? (
          <p className="chrome-label-case line-clamp-1 text-[10px] text-muted-foreground">
            {subtitleName}
          </p>
        ) : null}
      </div>
      <p className="chrome-label-case line-clamp-2 text-[10px] text-muted-foreground">
        {activeDeck?.description?.trim() ? activeDeck.description : "No description yet."}
      </p>
    </div>
  );
}
