"use client";

import { Plus } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { MobileActButton } from "@/components/shell/mobile-tab-bar/act-button";
import { MOBILE_TAB_ICON_CLASS } from "@/components/shell/mobile-tab-bar/metrics";
import { MobileSearchField } from "@/components/shell/mobile-tab-bar/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useDecksOptional } from "@/providers/DecksProvider";
import { DECK_VISIBILITY_MOBILE_TAB_LABELS, TABS } from "./constants";

export function DecksMobileActions() {
  const context = useDecksOptional();
  const { openAuthDialog } = useAuthDialog();
  if (!context) return null;

  const {
    actions,
    catalog: { isAuthenticated },
  } = context;

  const handleClick = () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }
    actions.openCreateDialog();
  };

  return (
    <MobileActButton label="New deck" tone="primary" onClick={handleClick}>
      <Plus className={MOBILE_TAB_ICON_CLASS} strokeWidth={2.5} />
    </MobileActButton>
  );
}

export function useDecksMobileActionsState() {
  return Boolean(useDecksOptional());
}

export function DecksMobileScopeControl() {
  const context = useDecksOptional();
  if (!context) return null;

  const {
    state,
    actions,
    catalog: { deckCounts, isAuthenticated },
  } = context;

  const visibleTabs = TABS.filter((tab) => (tab.id === "my-decks" ? isAuthenticated : true));

  return (
    <SegmentedControl
      orientation="horizontal"
      size="sm"
      stretch
      className="w-full bg-muted/30 md:hidden"
      itemClassName="h-10"
      value={state.activeTab}
      onValueChange={(value) => actions.setActiveTab(value as typeof state.activeTab)}
      items={visibleTabs.map((tab) => {
        const Icon = tab.icon;
        return {
          value: tab.id,
          label: <span>{DECK_VISIBILITY_MOBILE_TAB_LABELS[tab.id]}</span>,
          icon: Icon,
          badge: deckCounts[tab.id],
        };
      })}
    />
  );
}

export function DecksMobileSearch({ autoFocus }: { autoFocus?: boolean }) {
  const context = useDecksOptional();
  if (!context) return null;

  return (
    <MobileSearchField
      value={context.state.searchQuery}
      onChange={context.actions.setSearchQuery}
      placeholder="Search decks…"
      label="Search decks"
      name="decks-search"
      autoFocus={autoFocus}
    />
  );
}

export function useDecksMobileSearchState() {
  const context = useDecksOptional();
  return {
    available: Boolean(context),
    active: (context?.state.searchQuery.trim().length ?? 0) > 0,
  };
}
