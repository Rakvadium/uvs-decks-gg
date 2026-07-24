"use client";

import { CommunityView } from "@/components/community/community-view";
import { CommunityFloatingTopBar } from "@/components/community/community-view/floating-top-bar";
import { FloatingPageLayout } from "@/components/shell/floating-page-bar";

export default function CommunityPage() {
  return (
    <FloatingPageLayout bar={<CommunityFloatingTopBar />}>
      <CommunityView />
    </FloatingPageLayout>
  );
}
