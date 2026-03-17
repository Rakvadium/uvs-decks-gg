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

function DeckDetailsGallerySlotRegistration() {
  const gallerySlotOptions = useMemo(() => ({ label: "Gallery", icon: LayoutGrid }), []);
  useRegisterSlot("right-sidebar", "deck-gallery", GallerySidebar, gallerySlotOptions);
  return null;
}

export function DeckDetailsView() {
  const { deck, isLoading, isOwner } = useDeckDetails();

  const statsSlotOptions = useMemo(() => ({ label: "Stats", icon: BarChart3 }), []);
  const simulatorSlotOptions = useMemo(
    () => ({ label: "Simulator", icon: Shuffle, footer: HandSimulatorSidebarFooter }),
    []
  );
  const importExportSlotOptions = useMemo(() => ({ label: "Import/Export", icon: Download }), []);

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

        <div className="relative flex flex-col lg:flex-row gap-6">
          <DeckDetailsHeroPanel />

          <div className="flex-1">
            <div className="pl-10 md:pl-0">
              <DeckCardsSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
