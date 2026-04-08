"use client";

import { CommunityMediaFeedSection } from "../sections/media-feed-section";
import { CommunityTierListsSection } from "../sections/tier-lists-section";

export function CommunityView() {
  return (
    <div className="relative pb-8">
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" />

      <div className="relative grid gap-6">
        <section className="rounded-[28px] border border-border/60 bg-card/70 p-5 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.85)] backdrop-blur md:p-6">
          <CommunityMediaFeedSection />
        </section>

        <section className="rounded-[28px] border border-border/60 bg-card/70 p-5 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.85)] backdrop-blur md:p-6">
          <CommunityTierListsSection />
        </section>
      </div>
    </div>
  );
}
