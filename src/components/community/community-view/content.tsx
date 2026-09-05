"use client";

import { Surface } from "@/components/ui/card";
import { MobileLargeTitle } from "@/components/shell/mobile-large-title";
import { CommunityMediaFeedSection } from "../sections/media-feed-section";
import { CommunityTierListsSection } from "../sections/tier-lists-section";
import { CommunityRightSidebarSlots } from "../community-right-sidebar/slots";
import { CommunityMobileDestinationNav } from "../community-mobile-destination-nav";

const sectionClassName =
  "rounded-3xl border-border/50 bg-card/80 p-5 py-5 backdrop-blur-sm md:p-6";

export function CommunityView() {
  return (
    <div className="space-y-4 pb-8 md:space-y-6">
      <CommunityRightSidebarSlots />

      <MobileLargeTitle>Community</MobileLargeTitle>
      <CommunityMobileDestinationNav />

      <div className="relative">
        <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" />

        <div className="relative grid gap-6">
          <Surface className={sectionClassName}>
            <CommunityMediaFeedSection />
          </Surface>

          <Surface className={sectionClassName}>
            <CommunityTierListsSection />
          </Surface>
        </div>
      </div>
    </div>
  );
}
