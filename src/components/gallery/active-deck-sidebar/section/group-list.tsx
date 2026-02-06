import { ActiveDeckCardRow } from "../card-row";
import { useActiveDeckSectionContext } from "./context";

function ActiveDeckSectionEmptyState() {
  return (
    <div className="rounded-md border border-dashed border-border/50 px-3 py-2 text-[11px] text-muted-foreground">
      No cards in this section yet.
    </div>
  );
}

export function ActiveDeckSectionGroups() {
  const { groups, sectionKey } = useActiveDeckSectionContext();

  if (groups.length === 0) {
    return <ActiveDeckSectionEmptyState />;
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.type} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {group.total}
            </span>
          </div>

          <div className="space-y-1">
            {group.cards.map(({ card, count }) => (
              <ActiveDeckCardRow
                key={card._id}
                card={card}
                count={count}
                sectionKey={sectionKey}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
