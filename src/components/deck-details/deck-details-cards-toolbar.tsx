"use client";

import { useMobileLayoutModeOptional, usesMenuChrome } from "@/components/shell/mobile-layout/mode";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";
import { DeckListSortSelect } from "./deck-list-sort-select";
import { DeckDetailsViewModeToggle } from "./deck-details-view-mode-toggle";
import { DeckDetailsMobileHeaderTools } from "./mobile-header-tools";

export function DeckCardsToolbar() {
  const model = useDeckCardsSectionContext();
  const mode = useMobileLayoutModeOptional();
  // Menu and Pannu move view and sort into the top-right tools pill.
  if (usesMenuChrome(mode)) return <DeckDetailsMobileHeaderTools />;

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
