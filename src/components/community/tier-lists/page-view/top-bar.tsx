"use client";

import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MobileNavIconButton } from "@/components/shell/mobile-nav-bar/nav-icon-button";
import { MobileSearchField } from "@/components/shell/mobile-tab-bar/search-field";
import { useOptionalCommunityTierListsPageContext } from "./context";
import { BROWSER_TABS } from "./hook";

export function CommunityTierListsPageMobileNavAction() {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  return (
    <MobileNavIconButton
      label="New tier list"
      onClick={context.handleOpenCreateDialog}
      className="text-primary hover:bg-primary/10"
    >
      <Plus className="size-6" strokeWidth={2.25} />
    </MobileNavIconButton>
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
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        placeholder="Search tier lists…"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="h-9 pl-8"
        name="tier-lists-search-desktop"
        aria-label="Search tier lists"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}

export function CommunityTierListsPageMobileScopeControl() {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  const { activeTab, setActiveTab, publicLists, myLists } = context;

  return (
    <SegmentedControl
      size="sm"
      stretch
      className="w-full bg-muted/30 md:hidden"
      itemClassName="h-10"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      items={BROWSER_TABS.map((tab) => ({
        value: tab.id,
        label: <span>{tab.label}</span>,
        icon: tab.icon,
        badge:
          tab.id === "public"
            ? publicLists?.length || undefined
            : tab.id === "mine"
              ? myLists?.length || undefined
              : undefined,
      }))}
    />
  );
}

export function CommunityTierListsPageMobileSearch({ autoFocus }: { autoFocus?: boolean }) {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  return (
    <MobileSearchField
      value={context.searchQuery}
      onChange={context.setSearchQuery}
      placeholder="Search tier lists…"
      label="Search tier lists"
      name="tier-lists-search"
      autoFocus={autoFocus}
    />
  );
}

export function useCommunityTierListsPageMobileSearchState() {
  const context = useOptionalCommunityTierListsPageContext();
  return {
    available: Boolean(context) && context?.activeTab !== "rankings",
    active: (context?.searchQuery.trim().length ?? 0) > 0,
  };
}
