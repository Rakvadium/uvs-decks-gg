import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search decks..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <div className="flex max-w-full justify-center">
        <div className="inline-flex max-w-full flex-wrap justify-center gap-0.5 rounded-md border border-border/50 bg-muted/50 p-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = deckCounts[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-[9px] font-mono uppercase tracking-wide transition-all",
                  isActive
                    ? "bg-primary/20 text-primary shadow-[0_0_10px_-3px_var(--primary)]"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 ? (
                  <span
                    className={cn(
                      "rounded px-1 py-0 text-[8px]",
                      isActive ? "bg-primary/30" : "bg-muted"
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {isAuthenticated ? (
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full gap-1.5"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">New Deck</span>
        </Button>
      ) : null}
    </div>
  );
}
