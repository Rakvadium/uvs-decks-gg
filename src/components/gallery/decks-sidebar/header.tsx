import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
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
        <SearchBar
          placeholder="Search decks…"
          value={searchQuery}
          onSearchChange={setSearchQuery}
          className="max-w-none"
          endAdornment={
            searchQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : null
          }
        />
        {isAuthenticated ? (
          <Button
            size="sm"
            className="h-10 shrink-0 gap-1.5 px-3"
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
