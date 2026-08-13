"use client";

import { AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  DECK_SECTION_CONFIG as SECTION_CONFIG,
  DECK_SECTION_MOBILE_TAB_LABELS as MOBILE_TAB_LABELS,
  type DeckSection,
} from "@/lib/deck/display-config";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

export function DeckDetailsSectionTabs({
  layout = "auto",
}: {
  layout?: "auto" | "stacked-full";
} = {}) {
  const model = useDeckCardsSectionContext();
  const isMobile = useIsMobile();
  const stackedFull = layout === "stacked-full" || isMobile;

  const sections = ["main", "side", "reference"] as DeckSection[];

  return (
    <SegmentedControl
      orientation={stackedFull ? "horizontal" : "vertical"}
      size="sm"
      stretch={stackedFull}
      className="w-full bg-muted/20"
      value={model.activeSection}
      onValueChange={(value) => model.setActiveSection(value as DeckSection)}
      items={sections.map((section) => {
        const config = SECTION_CONFIG[section];
        const showSideWarning = section === "side" && model.isSideboardOverflow;

        return {
          value: section,
          label: (
            <span className="flex-1 text-left">
              {stackedFull ? MOBILE_TAB_LABELS[section] : config.label}
            </span>
          ),
          icon: config.icon,
          trailingIcon: showSideWarning ? <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" /> : undefined,
          badge: model.counts[section],
        };
      })}
    />
  );
}
