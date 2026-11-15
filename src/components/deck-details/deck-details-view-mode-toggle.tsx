"use client";

import { Layers, List } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { type DeckViewMode } from "./deck-list-utils";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

const VIEW_OPTIONS: { value: DeckViewMode; icon: typeof Layers; label: string }[] = [
  { value: "stacked", icon: Layers, label: "Stacked" },
  { value: "list", icon: List, label: "List" },
];

type DeckDetailsViewModeToggleProps = {
  variant?: "sidebar" | "toolbar";
};

export function DeckDetailsViewModeToggle({ variant = "sidebar" }: DeckDetailsViewModeToggleProps) {
  const { viewMode, setViewMode } = useDeckCardsSectionContext();
  const isToolbar = variant === "toolbar";

  return (
    <SegmentedControl
      size="sm"
      stretch={!isToolbar}
      className={isToolbar ? undefined : "w-full"}
      itemClassName={isToolbar ? "shrink-0 gap-1.5 px-2.5 sm:gap-2" : undefined}
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
