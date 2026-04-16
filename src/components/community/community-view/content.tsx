"use client";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { Surface } from "@/components/ui/card";
import { CommunityMediaFeedSection } from "../sections/media-feed-section";
import { CommunityTierListsSection } from "../sections/tier-lists-section";

const sectionClassName =
  "rounded-[28px] border-border/60 bg-card/70 p-5 py-5 backdrop-blur md:p-6";

export function CommunityView() {
  return (
    <div className="space-y-6 pb-8">
      <AppPageHeader
        title="Community"
        description="UniVersus content, tier lists, and highlights in one place."
      />

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
