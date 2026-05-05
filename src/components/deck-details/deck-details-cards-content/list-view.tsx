"use client";

import { Badge } from "@/components/ui/badge";
import { DeckListItem } from "../deck-details-card-items";
import { useDeckCardsSectionContext } from "../deck-details-cards-section-context";

export function DeckCardsListView() {
  const model = useDeckCardsSectionContext();

  const columns = [
    { column: "left" as const, groups: model.listGroups.left },
    { column: "right" as const, groups: model.listGroups.right },
  ].filter(({ groups }) => groups.length > 0);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
      {columns.map(({ column, groups }) => (
        <div key={column} className="w-full min-w-0 space-y-4 md:min-w-[280px] md:max-w-[50%] md:flex-1">
          {groups.map((group) => (
            <div key={group.key} className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-bold uppercase tracking-[0.18em]">{group.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                    {group.total}
                  </Badge>
                </div>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <div className="space-y-1 md:space-y-2">
                {group.entries.map((entry) => (
                  <DeckListItem key={entry.card._id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
