"use client";

import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";
import { DeckListSortSelect } from "./deck-list-sort-select";
import { DeckDetailsViewModeToggle } from "./deck-details-view-mode-toggle";

export function DeckCardsToolbar() {
  const model = useDeckCardsSectionContext();

  if (model.viewMode === "list") {
    return (
      <div className="pb-1 flex flex-row items-center justify-between gap-2 md:hidden">
        <div className="shrink-0">
          <DeckDetailsViewModeToggle variant="toolbar" />
        </div>
        <div className="min-w-0 shrink-0">
          <DeckListSortSelect triggerClassName="h-8 max-h-8 w-full max-w-[220px] px-3 py-1.5 text-[11px] leading-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-1 flex justify-start md:hidden">
      <DeckDetailsViewModeToggle variant="toolbar" />
    </div>
  );
}
