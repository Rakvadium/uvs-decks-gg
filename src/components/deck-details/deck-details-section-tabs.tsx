"use client";

import { AlertTriangle } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DECK_SECTION_CONFIG as SECTION_CONFIG, type DeckSection } from "@/lib/deck/display-config";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

export function DeckDetailsSectionTabs() {
  const model = useDeckCardsSectionContext();

  const sections = ["main", "side", "reference"] as DeckSection[];

  return (
    <SegmentedControl
      orientation="vertical"
      size="sm"
      className="w-full bg-muted/30"
      value={model.activeSection}
      onValueChange={(value) => model.setActiveSection(value as DeckSection)}
      items={sections.map((section) => {
        const config = SECTION_CONFIG[section];
        const showSideWarning = section === "side" && model.isSideboardOverflow;

        return {
          value: section,
          label: <span className="hidden flex-1 text-left sm:inline lg:inline">{config.label}</span>,
          icon: config.icon,
          trailingIcon: showSideWarning ? <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" /> : undefined,
          badge: model.counts[section],
        };
      })}
    />
  );
}
