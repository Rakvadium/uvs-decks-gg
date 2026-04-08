"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useOptionalCommunityTierListsPageContext } from "./context";
import { BROWSER_TABS } from "./hook";

export function CommunityTierListsPageTopBar() {
  const isMobile = useIsMobile();
  const context = useOptionalCommunityTierListsPageContext();

  if (!context) {
    return null;
  }

  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    handleOpenCreateDialog,
    publicLists,
    myLists,
  } = context;

  const items = BROWSER_TABS.map((tab) => ({
    value: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge: (tab.id === "public" ? publicLists?.length ?? 0 : myLists?.length ?? 0) || undefined,
  }));

  if (isMobile) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
            <Input
              placeholder="Search tier lists..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-9 border-primary/40 bg-background/50 pl-9 text-sm shadow-[0_0_10px_-3px_var(--primary)] focus-visible:border-primary focus-visible:shadow-[0_0_15px_-3px_var(--primary)]"
              name="tier-lists-search"
              spellCheck={false}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 shrink-0" asChild>
            <Link href="/community/rankings">Ranks</Link>
          </Button>
          <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" onClick={handleOpenCreateDialog}>
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </Button>
        </div>

        <SegmentedControl
          size="sm"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          items={items}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tier lists..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="h-10 border-border/60 bg-background/55 pl-10 text-sm"
          name="tier-lists-search"
          spellCheck={false}
        />
      </div>

      <SegmentedControl
        size="md"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        items={items}
      />

      <div className="ml-auto">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10" asChild>
            <Link href="/community/rankings">Community Rankings</Link>
          </Button>
          <Button variant="outline" className="h-10 gap-2" onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4" />
            <span>New List</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
