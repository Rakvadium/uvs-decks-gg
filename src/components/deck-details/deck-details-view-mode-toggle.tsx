"use client";

import { Layers, List } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
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
      className={cn("bg-muted/30", isToolbar ? "h-8 max-h-8 items-stretch md:h-7 md:max-h-7" : "w-full")}
      itemClassName={
        isToolbar
          ? "inline-flex h-full max-h-full min-h-0 shrink-0 items-center justify-center gap-1.5 px-2.5 py-0 leading-none sm:gap-2 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0"
          : undefined
      }
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
