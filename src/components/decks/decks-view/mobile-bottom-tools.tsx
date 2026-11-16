"use client";

import { Plus } from "lucide-react";
import { useStartAuth } from "@/components/auth/use-start-auth";
import { useMobileLayoutModeOptional, usesMenuChrome } from "@/components/shell/mobile-layout/mode";
import {
  MobileToolsOptionList,
  MobileToolsPanelHeader,
  MobileToolsSectionLabel,
} from "@/components/shell/mobile-layout/tools-pill";
import { MobileActButton } from "@/components/shell/mobile-tab-bar/act-button";
import { MOBILE_TAB_ICON_CLASS } from "@/components/shell/mobile-tab-bar/metrics";
import { MobileSearchField } from "@/components/shell/mobile-tab-bar/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DECK_LIST_SORT_OPTIONS, formatDeckFormatLabel, type DeckListSort } from "@/lib/deck/deck-list-view";
import { useDecksOptional } from "@/providers/DecksProvider";
import { DECK_VISIBILITY_MOBILE_TAB_LABELS, TABS } from "./constants";

export function DecksMobileActions() {
  const context = useDecksOptional();
  const startAuth = useStartAuth();
  if (!context) return null;

  const {
    actions,
    catalog: { isAuthenticated },
  } = context;

  const handleClick = () => {
    if (!isAuthenticated) {
      startAuth();
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

const ALL_FORMATS = "__all";

/** Pill state for the Menu layout: whether a search is live, and how many sort/filter choices are set. */
export function useDecksMobileToolsState() {
  const context = useDecksOptional();
  if (!context) return null;
  const { state } = context;
  return {
    searchActive: state.searchQuery.trim().length > 0,
    viewCount: (state.sort === "default" ? 0 : 1) + (state.formatFilter ? 1 : 0),
  };
}

/** Search, sort and format filter for the deck list, shown in the Menu layout's tools panel. */
export function DecksMobileToolsPanel({ focus, onClose }: { focus: string; onClose: () => void }) {
  const context = useDecksOptional();
  if (!context) return null;
  const { state, actions, formatOptions, visibleDecks, catalog } = context;
  const scopeTabs = TABS.filter((tab) => tab.id !== "my-decks" || catalog.isAuthenticated);

  return (
    <>
      <div className="shrink-0 px-3 pb-1 pt-3">
        <DecksMobileSearch autoFocus={focus === "search"} />
      </div>
      <MobileToolsPanelHeader
        title="Sort & Filter"
        detail={`${visibleDecks.length} ${visibleDecks.length === 1 ? "deck" : "decks"}`}
        onDone={onClose}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
        <MobileToolsSectionLabel>Show</MobileToolsSectionLabel>
        <MobileToolsOptionList
          options={scopeTabs.map((tab) => ({
            value: tab.id,
            label: (
              <span className="flex items-center justify-between gap-2">
                {DECK_VISIBILITY_MOBILE_TAB_LABELS[tab.id]}
                <span className="text-xs tabular-nums text-muted-foreground">{catalog.deckCounts[tab.id]}</span>
              </span>
            ),
          }))}
          value={state.activeTab}
          onChange={(value) => actions.setActiveTab(value as typeof state.activeTab)}
        />
        <MobileToolsSectionLabel>Sort by</MobileToolsSectionLabel>
        <MobileToolsOptionList<DeckListSort>
          options={DECK_LIST_SORT_OPTIONS}
          value={state.sort}
          onChange={actions.setSort}
        />
        {formatOptions.length > 0 ? (
          <>
            <MobileToolsSectionLabel>Format</MobileToolsSectionLabel>
            <MobileToolsOptionList
              options={[
                { value: ALL_FORMATS, label: "All formats" },
                ...formatOptions.map((format) => ({ value: format, label: formatDeckFormatLabel(format) })),
              ]}
              value={state.formatFilter ?? ALL_FORMATS}
              onChange={(value) => actions.setFormatFilter(value === ALL_FORMATS ? null : value)}
            />
          </>
        ) : null}
      </div>
    </>
  );
}

/**
 * Mine/Public/Tourney switch, shown in the page only with the Classic layout. Menu and Pannu put
 * scope in the tools pill and action menu (Pannu also in its action bar).
 */
export function DecksMobileScopeControl() {
  const context = useDecksOptional();
  const mode = useMobileLayoutModeOptional();
  if (!context) return null;
  if (usesMenuChrome(mode)) return null;

  const {
    state,
    actions,
    catalog: { deckCounts, isAuthenticated },
  } = context;

  const visibleTabs = TABS.filter((tab) => (tab.id === "my-decks" ? isAuthenticated : true));

  return (
    <SegmentedControl
      orientation="horizontal"
      stretch
      className="w-full md:hidden"
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
