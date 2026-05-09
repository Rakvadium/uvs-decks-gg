"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useDecksOptional } from "@/providers/DecksProvider";
import { DECK_VISIBILITY_MOBILE_TAB_LABELS, TABS } from "./constants";

export function DecksMobileTopBar() {
  const context = useDecksOptional();
  if (!context) return null;

  const {
    state,
    actions,
    catalog: { deckCounts, isAuthenticated },
  } = context;

  const visibleTabs = TABS.filter((tab) => (tab.id === "my-decks" ? isAuthenticated : true));

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <SegmentedControl
        orientation="horizontal"
        size="sm"
        stretch
        className="w-full bg-muted/30"
        value={state.activeTab}
        onValueChange={(value) => actions.setActiveTab(value as typeof state.activeTab)}
        items={visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return {
            value: tab.id,
            label: (
              <span className="flex-1 text-left">{DECK_VISIBILITY_MOBILE_TAB_LABELS[tab.id]}</span>
            ),
            icon: Icon,
            badge: deckCounts[tab.id],
          };
        })}
      />

      <div className="relative min-w-0 w-full flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/70" />
        <Input
          placeholder="Search decks..."
          value={state.searchQuery}
          onChange={(event) => actions.setSearchQuery(event.target.value)}
          className="h-9 border-primary/40 bg-background/50 pl-8 pr-3 text-sm shadow-[0_0_10px_-3px_var(--primary)] focus-visible:border-primary focus-visible:shadow-[0_0_15px_-3px_var(--primary)]"
          name="decks-search"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
