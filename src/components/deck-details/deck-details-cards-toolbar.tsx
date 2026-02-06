"use client";

import { AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DECK_SECTION_CONFIG as SECTION_CONFIG, type DeckSection } from "@/lib/deck/display-config";
import { LIST_SORT_SELECT_OPTIONS, VIEW_MODE_OPTIONS, type DeckViewMode } from "./deck-list-utils";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

const TOOLBAR_TAB_BUTTON_CLASS =
  "h-7 flex items-center gap-1 px-2 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap";

export function DeckCardsToolbar() {
  const model = useDeckCardsSectionContext();

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-full min-w-max items-center gap-1.5">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted/30 border border-border/50 p-1 shrink-0">
          {(["main", "side", "reference"] as DeckSection[]).map((section) => {
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
                  TOOLBAR_TAB_BUTTON_CLASS,
                  isActive
                    ? "bg-primary/20 text-primary shadow-[0_0_10px_-3px_var(--primary)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-3 w-3" />
                {config.label}
                {showSideWarning && <AlertTriangle className="h-3 w-3 text-destructive" />}
                <span
                  className={cn(
                    "rounded px-1 py-0.5 text-[9px]",
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

        <div className="ml-auto inline-flex items-center gap-1.5 shrink-0">
          <Select value={model.viewMode} onValueChange={(value) => model.setViewMode(value as DeckViewMode)}>
            <SelectTrigger className="h-7 w-[110px] text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIEW_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-[11px]">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {model.viewMode === "list" && (
            <Select value={model.selectedListSortValue} onValueChange={model.onSelectSort}>
              <SelectTrigger className="h-7 w-[180px] text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIST_SORT_SELECT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-[11px]">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
