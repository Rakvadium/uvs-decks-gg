"use client";

import { CreatorProgramView } from "@/components/community/creator-program-view";
import { FloatingBackPill, FloatingPageBar, FloatingPageLayout } from "@/components/shell/floating-page-bar";

export default function CreatorProgramPage() {
  return (
    <FloatingPageLayout
      bar={
        <FloatingPageBar
          left={<FloatingBackPill href="/community" label="Community" iconOnly />}
        />
      }
    >
      <CreatorProgramView />
    </FloatingPageLayout>
  );
}
