import { ChevronDown, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { TABS } from "./constants";
import { useDecksSidebarContext } from "./context";

function DeckTabMenuButton({ compact = false }: { compact?: boolean }) {
  const { activeTab, deckCounts, setActiveTab } = useDecksSidebarContext();
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const ActiveIcon = activeTabMeta.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 px-2.5 text-[10px] font-mono uppercase tracking-wide",
            compact && "w-9 px-0"
          )}
        >
          <ActiveIcon className="h-3.5 w-3.5" />
          {!compact ? (
            <>
              <span className="max-w-[6.25rem] truncate">{activeTabMeta.label}</span>
              <span className="rounded border border-primary/30 bg-primary/10 px-1 py-0 text-[9px]">
                {deckCounts[activeTabMeta.id]}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = deckCounts[tab.id];

          return (
            <DropdownMenuItem key={tab.id} onClick={() => setActiveTab(tab.id)}>
              <Icon className="h-3.5 w-3.5" />
              <span className={cn("text-xs font-mono uppercase tracking-wide", isActive && "text-primary")}>{tab.label}</span>
              <span className="ml-auto rounded border border-border/60 px-1 py-0 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                {count}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DecksSidebarHeader() {
  const isMobile = useIsMobile();
  const {
    activeTab,
    deckCounts,
    isAuthenticated,
    searchQuery,
    setActiveTab,
    setIsCreateOpen,
    setSearchQuery,
  } = useDecksSidebarContext();

  if (isMobile) {
    const activeTabMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

    return (
      <div className="shrink-0 border-b border-border/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Deck Browser</p>
            <p className="truncate font-display text-sm font-semibold uppercase tracking-wide text-foreground">
              {activeTabMeta.label}
            </p>
          </div>

          <DeckTabMenuButton />
        </div>

        <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {deckCounts[activeTabMeta.id]} total
        </p>
      </div>
    );
  }

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

export function DecksSidebarMobileBottomBar() {
  const isMobile = useIsMobile();
  const { isAuthenticated, searchQuery, setIsCreateOpen, setSearchQuery } = useDecksSidebarContext();

  if (!isMobile) return null;

  return (
    <div className="sticky bottom-0 z-20 space-y-2 border-t border-border/40 bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search decks..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>

        <DeckTabMenuButton compact />
      </div>

      {isAuthenticated ? (
        <Button variant="outline" size="sm" className="h-8 w-full gap-1.5" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">New Deck</span>
        </Button>
      ) : null}
    </div>
  );
}
