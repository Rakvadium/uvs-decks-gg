"use client";

import { useMemo } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { BarChart3, Download, LayoutGrid, Loader2, Shuffle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { DeckInvitePendingGate } from "@/components/deck-details/deck-invite-pending-gate";
import { DeckDetailsSharePanel } from "@/components/deck-details/deck-details-share-panel";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { DeckDetailsDesktopHeader } from "./deck-details-desktop-header";
import { DeckDetailsTopBar } from "./deck-details-top-bar";
import { DeckDetailsTopBarProvider } from "./deck-details-top-bar/context";
import { DeckCardsSection } from "./deck-details-cards-section";
import { DeckDetailsHeroPanel } from "./deck-details-hero-panel";
import {
  GallerySidebar,
  HandSimulatorSidebar,
  HandSimulatorSidebarFooter,
  ImportExportSidebar,
  StatsSidebar,
} from "./deck-details-sidebars";
import { DeckCardsSectionProvider } from "./deck-details-cards-section-context";
import { DeckDetailsSectionTabs } from "./deck-details-section-tabs";
import { DeckDetailsViewModeToggle } from "./deck-details-view-mode-toggle";
import { DeckDetailsEditDialog } from "./deck-details-edit-dialog";
import { TeamEditableWriteConflictBanner } from "@/components/deck/team-editable-write-conflict-banner";

function DeckDetailsGallerySlotRegistration() {
  const gallerySlotOptions = useMemo(() => ({ label: "Gallery", icon: LayoutGrid, priority: 0 }), []);
  useRegisterSlot("right-sidebar", "deck-gallery", GallerySidebar, gallerySlotOptions);
  return null;
}

export function DeckDetailsView() {
  const { deckId, deck, isLoading, isOwner } = useDeckDetails();
  const { isAuthenticated } = useConvexAuth();
  const pendingInvite = useQuery(
    api.deckShares.getPendingInvitePreview,
    !isLoading && !deck && isAuthenticated && deckId
      ? { deckId: deckId as Id<"decks"> }
      : "skip",
  );

  const statsSlotOptions = useMemo(() => ({ label: "Stats", icon: BarChart3, priority: 1 }), []);
  const simulatorSlotOptions = useMemo(
    () => ({ label: "Simulator", icon: Shuffle, footer: HandSimulatorSidebarFooter, priority: 1 }),
    []
  );
  const importExportSlotOptions = useMemo(() => ({ label: "Import/Export", icon: Download, priority: 1 }), []);

  useRegisterSlot("right-sidebar", "deck-stats", StatsSidebar, statsSlotOptions);
  useRegisterSlot("right-sidebar", "deck-simulator", HandSimulatorSidebar, simulatorSlotOptions);
  useRegisterSlot("right-sidebar", "deck-import-export", ImportExportSidebar, importExportSlotOptions);

  return (
    <DeckDetailsTopBarProvider>
      {isLoading || (!deck && pendingInvite === undefined) ? (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary drop-shadow-[0_0_10px_var(--primary)]" />
            <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Loading Deck Data</span>
          </div>
        </div>
      ) : !deck && pendingInvite && deckId ? (
        <DeckInvitePendingGate deckId={deckId} deckName={pendingInvite.deckName} />
      ) : !deck ? (
        <div className="flex h-full items-center justify-center p-4">
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            This deck could not be found, or you do not have permission to view it.
          </p>
        </div>
      ) : (
        <div className="flex flex-col max-md:gap-0 md:gap-6">
          <TeamEditableWriteConflictBanner className="max-md:mb-4" />
          <DeckDetailsEditDialog />
          {isOwner && <DeckDetailsGallerySlotRegistration />}
          <div className="hidden md:block">
            <DeckDetailsDesktopHeader />
          </div>
          <div className="sticky top-0 z-30 -mx-3 border-b border-border/50 bg-background/90 px-3 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:hidden">
            <DeckDetailsTopBar />
          </div>
          <div className="relative max-md:mt-4 md:mt-0">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl blur-xl" />

            <DeckCardsSectionProvider>
              <div className="relative flex flex-col lg:flex-row gap-4 lg:gap-6">
                <div className="flex flex-col gap-3 shrink-0 w-full lg:w-48 lg:self-start lg:sticky lg:top-6">
                  <DeckDetailsHeroPanel />
                  <DeckDetailsSharePanel />
                  <DeckDetailsSectionTabs />
                  <div className="hidden md:block">
                    <DeckDetailsViewModeToggle />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <DeckCardsSection />
                </div>
              </div>
            </DeckCardsSectionProvider>
          </div>
        </div>
      )}
    </DeckDetailsTopBarProvider>
  );
}
