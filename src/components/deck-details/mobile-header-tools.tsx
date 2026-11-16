"use client";

import { ArrowUpDown } from "lucide-react";
import { MobileChromePortal } from "@/components/shell/mobile-layout/chrome-portal";
import {
  MobileToolsOptionList,
  MobileToolsPanelHeader,
  MobileToolsPill,
  MobileToolsSectionLabel,
} from "@/components/shell/mobile-layout/tools-pill";
import { MOBILE_TAB_ICON_CLASS } from "@/components/shell/mobile-tab-bar/metrics";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";
import { LIST_SORT_SELECT_OPTIONS, type DeckViewMode } from "./deck-list-utils";

const VIEW_OPTIONS: Array<{ value: DeckViewMode; label: string }> = [
  { value: "stacked", label: "Stacked" },
  { value: "list", label: "List" },
];

function DeckViewSortPanel({ onClose }: { onClose: () => void }) {
  const model = useDeckCardsSectionContext();

  return (
    <>
      <MobileToolsPanelHeader title="View & Sort" onDone={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
        <MobileToolsSectionLabel>View</MobileToolsSectionLabel>
        <MobileToolsOptionList<DeckViewMode> options={VIEW_OPTIONS} value={model.viewMode} onChange={model.setViewMode} />
        <MobileToolsSectionLabel>Sort cards by</MobileToolsSectionLabel>
        {model.viewMode === "list" ? (
          <MobileToolsOptionList
            options={LIST_SORT_SELECT_OPTIONS.map((option) => ({ value: option.value as string, label: option.label }))}
            value={model.selectedListSortValue}
            onChange={model.onSelectSort}
          />
        ) : (
          <p className="px-4 text-sm text-muted-foreground">Sorting applies to the List view.</p>
        )}
      </div>
    </>
  );
}

/** Deck details' view and sort controls for the Menu layout's top-right pill. */
export function DeckDetailsMobileHeaderTools() {
  const { deck } = useDeckDetails();
  if (!deck) return null;

  return (
    <MobileChromePortal target="header-tools">
      <MobileToolsPill
        label="View and sort cards"
        triggers={[
          { id: "sort", label: "View and sort cards", icon: <ArrowUpDown className={MOBILE_TAB_ICON_CLASS} strokeWidth={2.25} /> },
        ]}
      >
        {({ close }) => <DeckViewSortPanel onClose={close} />}
      </MobileToolsPill>
    </MobileChromePortal>
  );
}
