"use client";

import { Layers, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DeckViewMode } from "./deck-list-utils";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

const VIEW_OPTIONS: { value: DeckViewMode; icon: typeof Layers; label: string }[] = [
  { value: "stacked", icon: Layers, label: "Stacked" },
  { value: "list", icon: List, label: "List" },
];

export function DeckDetailsViewModeToggle() {
  const { viewMode, setViewMode } = useDeckCardsSectionContext();

  return (
    <div className="tab-container flex gap-0 rounded-lg border border-border/50 bg-muted/30 p-1 w-full">
      {VIEW_OPTIONS.map(({ value, icon: Icon, label }) => {
        const isActive = viewMode === value;
        return (
          <button
            key={value}
            title={`${label} view`}
            onClick={() => setViewMode(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 h-7 text-[10px] font-mono uppercase tracking-wider transition-all",
              isActive
                ? "bg-primary/20 text-primary shadow-[0_0_8px_-2px_var(--primary)]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
