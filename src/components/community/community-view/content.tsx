"use client";

import { Surface } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useGameFeatures } from "@/games/game-context";
import { MobileLargeTitle } from "@/components/shell/mobile-large-title";
import { CommunityMediaFeedSection } from "../sections/media-feed-section";
import { CommunityTierListsSection } from "../sections/tier-lists-section";
import { CommunityRightSidebarSlots } from "../community-right-sidebar/slots";
import { CommunityMobileDestinationNav } from "../community-mobile-destination-nav";

const sectionClassName = "p-5 md:p-6";

export function CommunityView() {
  const { communityMedia, tierLists } = useGameFeatures();

  return (
    <div className="space-y-4 pb-8 md:space-y-6">
      {tierLists ? <CommunityRightSidebarSlots /> : null}

      <MobileLargeTitle>Community</MobileLargeTitle>
      <CommunityMobileDestinationNav />

      <div className="relative">
        <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" />

        <div className="relative grid gap-6">
          {communityMedia ? (
            <Surface className={sectionClassName}>
              <CommunityMediaFeedSection media={communityMedia} />
            </Surface>
          ) : null}

          {tierLists ? (
            <Surface className={sectionClassName}>
              <CommunityTierListsSection />
            </Surface>
          ) : null}

          {!communityMedia && !tierLists ? (
            <Surface className={sectionClassName}>
              <EmptyState title="Community features for this game are coming soon." />
            </Surface>
          ) : null}
        </div>
      </div>
    </div>
  );
}
