"use client";

import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { cn } from "@/lib/utils";
import { CommunityTierListDetailBoard } from "./board";
import { useCommunityTierListDetailContext } from "./context";
import { CommunityTierListDetailLoadingState } from "./loading-state";
import { CommunityTierListDetailPoolDialog } from "./pool-dialog";
import { CommunityTierListDetailPoolPanel } from "./pool-panel";
import { CommunityTierListDetailTopBar } from "./top-bar";
import { CommunityTierListDetailUnavailableState } from "./unavailable-state";

export function CommunityTierListDetailView() {
  const { detail, canEdit, selectedCards, getBackCard, isPresentationMode } = useCommunityTierListDetailContext();

  useRegisterSlot("top-bar", "community-tier-list-detail", CommunityTierListDetailTopBar);

  const desktopStickyTopBar = (
    <div className="sticky top-0 z-30 hidden shrink-0 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:block md:px-6">
      <CommunityTierListDetailTopBar />
    </div>
  );

  if (detail === undefined) {
    return (
      <div className="relative flex h-full flex-col overflow-y-auto">
        {desktopStickyTopBar}
        <CommunityTierListDetailLoadingState />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="relative flex h-full flex-col overflow-y-auto">
        {desktopStickyTopBar}
        <CommunityTierListDetailUnavailableState />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.10),transparent_24%)]" />

      {desktopStickyTopBar}

      <CardNavigationProvider cards={selectedCards} getBackCard={getBackCard}>
        <div className="relative z-10 flex min-h-full flex-col">
          <div
            className={cn(
              "flex-1 px-4 py-4 md:px-6 md:py-6",
              canEdit ? (isPresentationMode ? "pb-[10rem] md:pb-[12rem]" : "pb-[27rem] md:pb-[23rem]") : "pb-8"
            )}
          >
            <CommunityTierListDetailBoard />
          </div>

          <CommunityTierListDetailPoolPanel />
        </div>

        <CommunityTierListDetailPoolDialog />
      </CardNavigationProvider>
    </div>
  );
}
