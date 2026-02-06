"use client";

import { Badge } from "@/components/ui/badge";
import { DeckListItem } from "../deck-details-card-items";
import { useDeckCardsSectionContext } from "../deck-details-cards-section-context";

export function DeckCardsListView() {
  const model = useDeckCardsSectionContext();

  return (
    <div className="flex flex-wrap gap-4">
      {[model.listGroups.left, model.listGroups.right].map((columnGroups, columnIndex) => (
        <div key={columnIndex} className="min-w-[280px] flex-1 space-y-4">
          {columnGroups.map((group) => (
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

              <div className="space-y-2">
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
