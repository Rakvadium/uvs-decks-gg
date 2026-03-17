"use client";

import { Check, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDecksOptional } from "@/providers/DecksProvider";
import { TABS } from "./constants";

export function DecksMobileTopBar() {
  const context = useDecksOptional();
  if (!context) return null;

  const {
    state,
    actions,
    catalog: { deckCounts },
  } = context;

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative min-w-0 flex-1">
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-primary/40 bg-background/60 shadow-[0_0_10px_-4px_var(--primary)]"
            aria-label="Filter deck visibility"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-56 border-primary/30 bg-background/95 backdrop-blur-lg"
        >
          <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Deck Visibility
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = state.activeTab === tab.id;
            const count = deckCounts[tab.id];

            return (
              <DropdownMenuItem
                key={tab.id}
                onSelect={() => actions.setActiveTab(tab.id)}
                className="gap-2 font-mono text-xs uppercase tracking-wide"
              >
                <Check className={cn("h-3.5 w-3.5", isActive ? "text-primary opacity-100" : "opacity-0")} />
                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1">{tab.label}</span>
                {count > 0 ? (
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px]",
                      isActive ? "border-primary/40 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
