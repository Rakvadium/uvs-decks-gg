"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { useOptionalCommunityTierListsPageContext } from "./context";
import { BROWSER_TABS } from "./hook";

export function CommunityTierListsPagePrimaryAction({
  className,
  label = "New List",
}: {
  className?: string;
  label?: string;
} = {}) {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  const { handleOpenCreateDialog } = context;

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("h-9 gap-1.5", className)}
      onClick={handleOpenCreateDialog}
    >
      <Plus className="h-3.5 w-3.5" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}

export function CommunityTierListsPageTabs() {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  const { activeTab, setActiveTab, publicLists, myLists } = context;

  const items = BROWSER_TABS.map((tab) => ({
    value: tab.id,
    label: <span>{tab.label}</span>,
    icon: tab.icon,
    badge:
      tab.id === "public"
        ? publicLists?.length || undefined
        : tab.id === "mine"
          ? myLists?.length || undefined
          : undefined,
  }));

  return (
    <SegmentedControl
      size="sm"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      items={items}
    />
  );
}

export function CommunityTierListsPageSearch() {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  const { activeTab, searchQuery, setSearchQuery } = context;
  if (activeTab === "rankings") return null;

  return (
    <div className="relative w-full min-w-[300px] max-w-[30rem]">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search tier lists..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="h-9 pl-8 text-sm"
        name="tier-lists-search-desktop"
        spellCheck={false}
      />
    </div>
  );
}

export function CommunityTierListsPageTopBar() {
  const context = useOptionalCommunityTierListsPageContext();

  if (!context) {
    return null;
  }

  const { activeTab, setActiveTab, searchQuery, setSearchQuery, publicLists, myLists } = context;
  const showSearch = activeTab !== "rankings";

  const items = BROWSER_TABS.map((tab) => ({
    value: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge:
      tab.id === "public"
        ? publicLists?.length || undefined
        : tab.id === "mine"
          ? myLists?.length || undefined
          : undefined,
  }));

  return (
    <div className="flex w-full flex-col gap-2">
      <SegmentedControl
        size="sm"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        items={items}
      />

      {showSearch ? (
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/70" />
          <Input
            placeholder="Search tier lists..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 border-primary/40 bg-background/50 pl-8 pr-3 text-sm shadow-[0_0_10px_-3px_var(--primary)] focus-visible:border-primary focus-visible:shadow-[0_0_15px_-3px_var(--primary)]"
            name="tier-lists-search"
            spellCheck={false}
          />
        </div>
      ) : null}
    </div>
  );
}
