import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { useDecksOptional } from "@/providers/DecksProvider";
import { TABS } from "./constants";

export function DecksPagePrimaryAction() {
  const context = useDecksOptional();
  if (!context) return null;

  const {
    actions,
    catalog: { isAuthenticated },
  } = context;

  if (!isAuthenticated) return null;

  return (
    <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={actions.openCreateDialog}>
      <Plus className="h-3.5 w-3.5" />
      <span className="text-xs">New Deck</span>
    </Button>
  );
}

export function DecksPageSearchAndTabs() {
  const context = useDecksOptional();
  if (!context) return null;

  const {
    state,
    actions,
    catalog: { deckCounts, isAuthenticated },
  } = context;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
      <div className="relative min-w-0 max-w-md flex-1">
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

      <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
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
      </div>
    </div>
  );
}
