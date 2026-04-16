"use client";

import { CommunityTierListsPageView } from "@/components/community/tier-lists/page-view";

export default function TierListsPageClient() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 md:p-6">
      <CommunityTierListsPageView />
    </div>
  );
}
