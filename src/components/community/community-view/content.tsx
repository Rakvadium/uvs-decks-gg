"use client";

import { Surface } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/typography-headings";
import { CommunityMediaFeedSection } from "../sections/media-feed-section";
import { CommunityTierListsSection } from "../sections/tier-lists-section";
import { CommunityRightSidebarSlots } from "../community-right-sidebar/slots";
import { CommunityMobileDestinationNav } from "../community-mobile-destination-nav";

const sectionClassName =
  "rounded-3xl border-border/50 bg-card/80 p-5 py-5 backdrop-blur-sm md:p-6";

export function CommunityView() {
  return (
    <div className="space-y-6 pb-8">
      <CommunityRightSidebarSlots />

      <div className="md:hidden space-y-3 border-b border-border/50 pb-4">
        <PageHeading className="font-display text-2xl font-bold uppercase tracking-widest">
          Community
        </PageHeading>
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CommunityMobileDestinationNav />
        </div>
      </div>

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
