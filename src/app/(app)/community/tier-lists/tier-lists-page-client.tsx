"use client";

import { CommunityTierListsPageView } from "@/components/community/tier-lists/page-view";

export default function TierListsPageClient() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:h-full md:p-6">
      <CommunityTierListsPageView />
    </div>
  );
}
