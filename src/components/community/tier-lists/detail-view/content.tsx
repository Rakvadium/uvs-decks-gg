"use client";

import { FloatingPageLayout } from "@/components/shell/floating-page-bar";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { cn } from "@/lib/utils";
import { CommunityTierListDetailBoard } from "./board";
import { useCommunityTierListDetailContext } from "./context";
import { CommunityTierListDetailFloatingTopBar } from "./floating-top-bar";
import { CommunityTierListDetailLoadingState } from "./loading-state";
import { CommunityTierListDetailCommentsSection } from "./comments-section";
import { CommunityTierListDetailPoolDialog } from "./pool-dialog";
import { CommunityTierListDetailPoolPanel } from "./pool-panel";
import { CommunityTierListDetailTopBar } from "./top-bar";
import { CommunityTierListDetailUnavailableState } from "./unavailable-state";

export function CommunityTierListDetailView() {
  const { detail, canEdit, selectedCards, getBackCard, isPresentationMode } = useCommunityTierListDetailContext();

  useRegisterSlot("top-bar", "community-tier-list-detail", CommunityTierListDetailTopBar);

  if (detail === undefined) {
    return <CommunityTierListDetailLoadingState />;
  }

  if (!detail) {
    return <CommunityTierListDetailUnavailableState />;
  }

  return (
    <FloatingPageLayout
      bar={<CommunityTierListDetailFloatingTopBar />}
      contentClassName="p-0 md:p-0 md:pt-[4.75rem]"
    >
      <CardNavigationProvider cards={selectedCards} getBackCard={getBackCard}>
        <div className="relative z-10 flex min-h-full flex-col">
          <div className="relative space-y-6 px-3 pt-3 md:px-6 md:pt-6 flex-1 flex flex-col">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.10),transparent_24%)]" />

            <div
              className={cn(
                "relative z-10 flex-1",
                canEdit ? (isPresentationMode ? "pb-[10rem] md:pb-[12rem]" : "pb-[27rem] md:pb-[23rem]") : "pb-8"
              )}
            >
              <CommunityTierListDetailBoard />
              <CommunityTierListDetailCommentsSection />
            </div>
          </div>

          <CommunityTierListDetailPoolPanel />
        </div>

        <CommunityTierListDetailPoolDialog />
      </CardNavigationProvider>
    </FloatingPageLayout>
  );
}
