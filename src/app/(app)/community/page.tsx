"use client";

import { CommunityView } from "@/components/community/community-view";

export default function CommunityPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:h-full">
      <CommunityView />
    </div>
  );
}
