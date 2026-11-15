import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TABS } from "./constants";
import { useDecksSidebarContext } from "./context";

export function DecksSidebarHeader() {
  const {
    activeTab,
    deckCounts,
    isAuthenticated,
    searchQuery,
    setActiveTab,
    setIsCreateOpen,
    setSearchQuery,
  } = useDecksSidebarContext();

  return (
    <div className="shrink-0 space-y-3 border-b border-border/30 p-4">
      <div className="flex items-center gap-2">
        <SearchField
          placeholder="Search decks…"
          value={searchQuery}
          onValueChange={setSearchQuery}
          name="decks-sidebar-search"
          className="flex-1"
        />
        {isAuthenticated ? (
          <Button
            className="shrink-0 gap-1.5 px-3"
            aria-label="New Deck"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        ) : null}
      </div>

      <SegmentedControl
        size="sm"
        stretch
        className="w-full"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        items={TABS.map((tab) => ({
          value: tab.id,
          label: tab.shortLabel,
          icon: tab.icon,
          badge: deckCounts[tab.id],
        }))}
      />
    </div>
  );
}
