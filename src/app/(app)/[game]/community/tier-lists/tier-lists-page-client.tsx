"use client";

import { CommunityTierListsPageView } from "@/components/community/tier-lists/page-view";
import { CommunityTierListsFloatingTopBar } from "@/components/community/tier-lists/page-view/floating-top-bar";
import { FloatingPageLayout } from "@/components/shell/floating-page-bar";

export default function TierListsPageClient() {
  return (
    <FloatingPageLayout bar={<CommunityTierListsFloatingTopBar />} pageWash="radial">
      <CommunityTierListsPageView />
    </FloatingPageLayout>
  );
}
