"use client";

import { Plus } from "lucide-react";
import {
  FloatingActionPill,
  FloatingBackPill,
  FloatingPageBar,
  FloatingSearchCapsule,
  FloatingTabsPill,
} from "@/components/shell/floating-page-bar";
import { useOptionalCommunityTierListsPageContext } from "./context";
import { BROWSER_TABS } from "./hook";

export function CommunityTierListsFloatingTopBar() {
  const context = useOptionalCommunityTierListsPageContext();
  if (!context) return null;

  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    publicLists,
    myLists,
    handleOpenCreateDialog,
  } = context;

  const showListBrowser = activeTab !== "rankings";

  return (
    <FloatingPageBar
      left={
        <>
          <FloatingBackPill href="/community" label="Community" iconOnly />
          <FloatingTabsPill
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            items={BROWSER_TABS.map((tab) => ({
              value: tab.id,
              label: tab.label,
              icon: tab.icon,
              badge:
                tab.id === "public"
                  ? publicLists?.length || undefined
                  : tab.id === "mine"
                    ? myLists?.length || undefined
                    : undefined,
            }))}
          />
        </>
      }
      center={
        showListBrowser ? (
          <FloatingSearchCapsule
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tier lists…"
            name="tier-lists-search-desktop"
            aria-label="Search tier lists"
          />
        ) : null
      }
      right={
        <FloatingActionPill onClick={handleOpenCreateDialog}>
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">New List</span>
        </FloatingActionPill>
      }
    />
  );
}
