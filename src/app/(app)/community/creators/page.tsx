"use client";

import { CreatorProgramView } from "@/components/community/creator-program-view";
import { CommunityFloatingTopBar } from "@/components/community/community-view/floating-top-bar";
import { FloatingPageLayout } from "@/components/shell/floating-page-bar";

export default function CreatorProgramPage() {
  return (
    <FloatingPageLayout bar={<CommunityFloatingTopBar />}>
      <CreatorProgramView />
    </FloatingPageLayout>
  );
}
