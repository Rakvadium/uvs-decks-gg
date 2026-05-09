"use client";

import { CommunityTierListsPageView } from "@/components/community/tier-lists/page-view";

export default function TierListsPageClient() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:h-full">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_32%),radial-gradient(circle_at_80%_8%,rgba(20,184,166,0.10),transparent_28%)]" />
      <div className="relative z-[1] p-4 md:p-6">
        <CommunityTierListsPageView />
      </div>
    </div>
  );
}
