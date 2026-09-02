"use client";

import { Plus } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import {
  FloatingActionPill,
  FloatingPageBar,
  FloatingPageTitle,
  FloatingSearchCapsule,
  FloatingTabsPill,
} from "@/components/shell/floating-page-bar";
import { useDecksOptional } from "@/providers/DecksProvider";
import { TABS } from "./constants";

export function DecksFloatingTopBar() {
  const context = useDecksOptional();
  const { openAuthDialog } = useAuthDialog();
  if (!context) return null;

  const {
    state,
    actions,
    catalog: { deckCounts, isAuthenticated },
  } = context;

  const visibleTabs = TABS.filter((tab) => (tab.id === "my-decks" ? isAuthenticated : true));

  const handleNewDeck = () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }
    actions.openCreateDialog();
  };

  return (
    <FloatingPageBar
      left={
        <>
          <FloatingPageTitle>Decks</FloatingPageTitle>
          <FloatingTabsPill
            value={state.activeTab}
            onValueChange={(value) => actions.setActiveTab(value as typeof state.activeTab)}
            items={visibleTabs.map((tab) => ({
              value: tab.id,
              label: tab.shortLabel,
              icon: tab.icon,
              badge: deckCounts[tab.id] > 0 ? deckCounts[tab.id] : undefined,
            }))}
          />
        </>
      }
      center={
        <FloatingSearchCapsule
          value={state.searchQuery}
          onChange={actions.setSearchQuery}
          placeholder="Search decks…"
          name="decks-search-desktop"
          aria-label="Search decks"
        />
      }
      right={
        <FloatingActionPill onClick={handleNewDeck}>
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">New Deck</span>
        </FloatingActionPill>
      }
    />
  );
}
