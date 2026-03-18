"use client";

import {
  CommunityDeckSpotlightsSection,
  CommunityLabsSection,
  CommunityMediaFeedSection,
  CommunityTierListsSection,
} from "./community-sections";

export function CommunityView() {
  return (
    <div className="relative space-y-8 pb-6">
      <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-10 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-25" />

      <CommunityMediaFeedSection />
      <CommunityTierListsSection />
      <CommunityDeckSpotlightsSection />
      <CommunityLabsSection />
    </div>
  );
}
