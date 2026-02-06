import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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

      <div className="flex gap-1 rounded-md border border-border/50 bg-muted/50 p-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = state.activeTab === tab.id;
          const count = deckCounts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => actions.setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all",
                isActive
                  ? "bg-primary/20 text-primary shadow-[0_0_10px_-3px_var(--primary)]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {count > 0 ? (
                <span
                  className={cn(
                    "rounded px-1 py-0.5 text-[10px]",
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
