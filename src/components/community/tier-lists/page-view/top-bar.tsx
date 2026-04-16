"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { useOptionalCommunityTierListsPageContext } from "./context";
import { BROWSER_TABS } from "./hook";

export function CommunityTierListsPagePrimaryAction() {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  const { handleOpenCreateDialog } = context;

  return (
    <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleOpenCreateDialog}>
      <Plus className="h-3.5 w-3.5" />
      <span className="text-xs">New List</span>
    </Button>
  );
}

export function CommunityTierListsPageToolbar() {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  const { activeTab, setActiveTab, searchQuery, setSearchQuery, publicLists, myLists } = context;
  const showSearch = activeTab !== "rankings";

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
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
      {showSearch ? (
        <div className="relative min-w-0 max-w-md flex-1">
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
      ) : null}

      <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showSearch ? <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" /> : null}
        <SegmentedControl
          size="sm"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          items={items}
        />
      </div>
    </div>
  );
}

export function CommunityTierListsPageTopBar() {
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
      <div className="flex items-center gap-2">
        {showSearch ? (
          <div className="relative min-w-0 flex-1">
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
        ) : (
          <div className="min-w-0 flex-1" />
        )}
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
