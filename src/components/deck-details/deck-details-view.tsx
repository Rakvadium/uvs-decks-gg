"use client";

import { useMemo } from "react";
import { BarChart3, Download, LayoutGrid, Loader2, Shuffle } from "lucide-react";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { DeckDetailsTopBar } from "./deck-details-top-bar";
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

function DeckDetailsGallerySlotRegistration() {
  const gallerySlotOptions = useMemo(() => ({ label: "Gallery", icon: LayoutGrid, priority: 0 }), []);
  useRegisterSlot("right-sidebar", "deck-gallery", GallerySidebar, gallerySlotOptions);
  return null;
}

export function DeckDetailsView() {
  const { deck, isLoading, isOwner } = useDeckDetails();

  const statsSlotOptions = useMemo(() => ({ label: "Stats", icon: BarChart3, priority: 1 }), []);
  const simulatorSlotOptions = useMemo(
    () => ({ label: "Simulator", icon: Shuffle, footer: HandSimulatorSidebarFooter, priority: 1 }),
    []
  );
  const importExportSlotOptions = useMemo(() => ({ label: "Import/Export", icon: Download, priority: 1 }), []);

  useRegisterSlot("right-sidebar", "deck-stats", StatsSidebar, statsSlotOptions);
  useRegisterSlot("right-sidebar", "deck-simulator", HandSimulatorSidebar, simulatorSlotOptions);
  useRegisterSlot("right-sidebar", "deck-import-export", ImportExportSidebar, importExportSlotOptions);
  useRegisterSlot("top-bar", "deck-details-header", DeckDetailsTopBar);

  if (isLoading || !deck) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary drop-shadow-[0_0_10px_var(--primary)]" />
          <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Loading Deck Data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && <DeckDetailsGallerySlotRegistration />}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl blur-xl" />

        <DeckCardsSectionProvider>
          <div className="relative flex flex-col lg:flex-row gap-6">
            <div className="flex flex-col gap-3 shrink-0 w-full lg:w-48 lg:self-start lg:sticky lg:top-6">
              <DeckDetailsHeroPanel />
              <DeckDetailsSectionTabs />
              <DeckDetailsViewModeToggle />
            </div>

            <div className="flex-1 min-w-0">
              <DeckCardsSection />
            </div>
          </div>
        </DeckCardsSectionProvider>
      </div>
    </div>
  );
}
