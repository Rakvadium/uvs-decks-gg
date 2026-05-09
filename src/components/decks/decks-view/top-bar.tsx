import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { useDecksOptional } from "@/providers/DecksProvider";
import { TABS } from "./constants";

export function DecksPagePrimaryAction({ className }: { className?: string } = {}) {
  const context = useDecksOptional();
  if (!context) return null;

  const {
    actions,
    catalog: { isAuthenticated },
  } = context;

  if (!isAuthenticated) return null;

  return (
    <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", className)} onClick={actions.openCreateDialog}>
      <Plus className="h-3.5 w-3.5" />
      <span className="text-xs">New Deck</span>
    </Button>
  );
}

export function DecksPageTabs() {
  const context = useDecksOptional();
  if (!context) return null;

  const {
    state,
    actions,
    catalog: { deckCounts, isAuthenticated },
  } = context;

  return (
    <SegmentedControl
      size="sm"
      value={state.activeTab}
      onValueChange={(value) => actions.setActiveTab(value as typeof state.activeTab)}
      items={TABS.filter((tab) => (tab.id === "my-decks" ? isAuthenticated : true)).map((tab) => ({
        value: tab.id,
        label: <span>{tab.shortLabel}</span>,
        icon: tab.icon,
        badge: deckCounts[tab.id] > 0 ? deckCounts[tab.id] : undefined,
      }))}
    />
  );
}

export function DecksPageSearch() {
  const context = useDecksOptional();
  if (!context) return null;

  const { state, actions } = context;

  return (
    <div className="relative w-full min-w-[300px] max-w-[30rem]">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search decks..."
        value={state.searchQuery}
        onChange={(event) => actions.setSearchQuery(event.target.value)}
        className="h-9 pl-8 text-sm"
        name="decks-search-desktop"
        spellCheck={false}
      />
    </div>
  );
}
