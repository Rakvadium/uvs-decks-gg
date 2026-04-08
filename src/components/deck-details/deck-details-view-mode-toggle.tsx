"use client";

import { Layers, List } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { type DeckViewMode } from "./deck-list-utils";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

const VIEW_OPTIONS: { value: DeckViewMode; icon: typeof Layers; label: string }[] = [
  { value: "stacked", icon: Layers, label: "Stacked" },
  { value: "list", icon: List, label: "List" },
];

export function DeckDetailsViewModeToggle() {
  const { viewMode, setViewMode } = useDeckCardsSectionContext();

  return (
    <SegmentedControl
      size="sm"
      className="w-full bg-muted/30"
      value={viewMode}
      onValueChange={(value) => setViewMode(value as DeckViewMode)}
      items={VIEW_OPTIONS.map(({ value, icon, label }) => ({
        value,
        label: <span className="hidden sm:inline">{label}</span>,
        icon,
      }))}
    />
  );
}
