"use client";

import type { LucideIcon } from "lucide-react";
import { Copy, Edit3, ExternalLink, FileDown, Plus } from "lucide-react";
import { useStartAuth } from "@/components/auth/use-start-auth";
import { useOptionalCommunityTierListsPageContext } from "@/components/community/tier-lists/page-view/context";
import { DECK_VISIBILITY_MOBILE_TAB_LABELS, TABS } from "@/components/decks/decks-view/constants";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { useDecksOptional } from "@/providers/DecksProvider";
import type { MobileLayoutRoute } from "./routes";

/** A non-panel entry in the action menu: it does something, switches what's shown, or navigates. */
export interface MobileMenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Entries with the same group render together under that label. */
  group?: string;
  tone?: "primary";
  /** For entries that pick one of several views (e.g. My Decks); shows a check. */
  selected?: boolean;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
}

const DECK_TAB_MENU_LABELS: Record<(typeof TABS)[number]["id"], string> = {
  "my-decks": "My Decks",
  public: "Public Decks",
  tournament: "Tournament Decks",
};

/**
 * The action menu's direct entries for a route. Panels (context and extra data) come from the
 * page's `right-sidebar` slots; these do something or switch what the page shows.
 */
export function useRouteMenuActions(routeId: MobileLayoutRoute["id"]): MobileMenuAction[] {
  const { activeDeck } = useActiveDeck();
  const decks = useDecksOptional();
  const deckDetails = useDeckDetailsOptional();
  const tierLists = useOptionalCommunityTierListsPageContext();
  const startAuth = useStartAuth();

  if (routeId === "gallery") {
    if (!activeDeck) return [];
    return [{ id: "open-deck", label: "Open Deck Details", icon: ExternalLink, href: `/decks/${activeDeck._id}` }];
  }

  if (routeId === "decks" && decks) {
    const signedIn = decks.catalog.isAuthenticated;
    const create = (intent: "blank" | "import") => (signedIn ? decks.actions.openCreateDialog(intent) : startAuth());
    const scope: MobileMenuAction[] = TABS.filter((tab) => tab.id !== "my-decks" || signedIn).map((tab) => ({
      id: `scope-${tab.id}`,
      label: DECK_TAB_MENU_LABELS[tab.id] ?? DECK_VISIBILITY_MOBILE_TAB_LABELS[tab.id],
      icon: tab.icon,
      group: "Show",
      selected: decks.state.activeTab === tab.id,
      onSelect: () => decks.actions.setActiveTab(tab.id),
    }));
    return [
      ...scope,
      { id: "new-deck", label: "New Deck", icon: Plus, group: "Create", tone: "primary", onSelect: () => create("blank") },
      { id: "import-deck", label: "Import Deck", icon: FileDown, group: "Create", onSelect: () => create("import") },
    ];
  }

  if (routeId === "deck-details" && deckDetails?.deck) {
    const actions: MobileMenuAction[] = [
      {
        id: "duplicate",
        label: deckDetails.isDuplicating ? "Duplicating…" : "Duplicate Deck",
        icon: Copy,
        group: "Deck",
        disabled: deckDetails.isDuplicating,
        onSelect: deckDetails.requestDuplicate,
      },
    ];
    if (deckDetails.isOwner) {
      actions.push({
        id: "edit",
        label: "Edit Deck",
        icon: Edit3,
        group: "Deck",
        tone: "primary",
        onSelect: () => deckDetails.startEditing(),
      });
    }
    return actions;
  }

  // The Tier Lists page provides this context; other Community pages have no direct actions.
  if (routeId === "community" && tierLists) {
    return [
      { id: "new-tier-list", label: "New Tier List", icon: Plus, tone: "primary", onSelect: tierLists.handleOpenCreateDialog },
    ];
  }

  return [];
}
