"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DECK_SECTION_CONFIG as SECTION_CONFIG, type DeckSection } from "@/lib/deck/display-config";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

export function DeckDetailsSectionTabs() {
  const model = useDeckCardsSectionContext();

  const sections = ["main", "side", "reference"] as DeckSection[];

  return (
    <div className="tab-container tab-container-vertical flex lg:flex-col gap-0 rounded-lg border border-border/50 bg-muted/30 p-1 w-full">
      {sections.map((section) => {
        const config = SECTION_CONFIG[section];
        const Icon = config.icon;
        const count = model.counts[section];
        const isActive = model.activeSection === section;
        const showSideWarning = section === "side" && model.isSideboardOverflow;

        return (
          <button
            key={section}
            onClick={() => model.setActiveSection(section)}
            className={cn(
              "flex flex-1 lg:flex-none items-center justify-center lg:justify-start gap-2 px-2 lg:px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all lg:w-full",
              isActive
                ? "bg-primary/20 text-primary shadow-[0_0_8px_-2px_var(--primary)]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline lg:inline flex-1 text-left">{config.label}</span>
            {showSideWarning && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] shrink-0 lg:ml-auto",
                showSideWarning
                  ? "bg-destructive/20 text-destructive"
                  : isActive
                    ? "bg-primary/30"
                    : "bg-muted"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
