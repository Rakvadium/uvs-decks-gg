"use client";

import { CommunityTierListsPageView } from "@/components/community/tier-lists/page-view";
import { CommunityTierListsFloatingTopBar } from "@/components/community/tier-lists/page-view/floating-top-bar";
import { FloatingPageLayout } from "@/components/shell/floating-page-bar";

export default function TierListsPageClient() {
  return (
    <FloatingPageLayout
      bar={<CommunityTierListsFloatingTopBar />}
      contentClassName="relative"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_32%),radial-gradient(circle_at_80%_8%,color-mix(in_oklab,var(--secondary)_10%,transparent),transparent_28%)]" />
      <div className="relative z-[1]">
        <CommunityTierListsPageView />
      </div>
    </FloatingPageLayout>
  );
}
