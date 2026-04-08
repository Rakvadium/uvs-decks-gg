import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { useDecksOptional } from "@/providers/DecksProvider";
import { TABS } from "./constants";

export function DecksTopBar() {
  const context = useDecksOptional();
  if (!context) return null;

  const {
    state,
    actions,
    catalog: { deckCounts, isAuthenticated },
  } = context;

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search decks..."
          value={state.searchQuery}
          onChange={(event) => actions.setSearchQuery(event.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <SegmentedControl
        size="sm"
        value={state.activeTab}
        onValueChange={(value) => actions.setActiveTab(value as typeof state.activeTab)}
        items={TABS.filter((tab) => (tab.id === "my-decks" ? isAuthenticated : true)).map((tab) => ({
          value: tab.id,
          label: <span className="hidden sm:inline">{tab.shortLabel}</span>,
          icon: tab.icon,
          badge: deckCounts[tab.id] > 0 ? deckCounts[tab.id] : undefined,
        }))}
      />

      {isAuthenticated ? (
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={actions.openCreateDialog}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden text-xs sm:inline">New Deck</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
