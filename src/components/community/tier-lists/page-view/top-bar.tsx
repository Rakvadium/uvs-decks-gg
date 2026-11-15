"use client";

import { Plus } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MobileNavIconButton } from "@/components/shell/mobile-nav-bar/nav-icon-button";
import { MobileSearchField } from "@/components/shell/mobile-tab-bar/search-field";
import { useOptionalCommunityTierListsPageContext } from "./context";

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

  const { activeTab, setActiveTab, publicLists, myLists, browserTabs } = context;

  const items = browserTabs.map((tab) => ({
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

export function CommunityTierListsPageMobileScopeControl() {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  const { activeTab, setActiveTab, publicLists, myLists, browserTabs } = context;

  return (
    <SegmentedControl
      stretch
      className="w-full md:hidden"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      items={browserTabs.map((tab) => ({
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
