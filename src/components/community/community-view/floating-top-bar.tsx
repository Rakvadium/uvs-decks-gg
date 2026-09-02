"use client";

import { FloatingPageBar, FloatingPageTitle } from "@/components/shell/floating-page-bar";
import { CommunityDestinationTabs } from "../community-destination-tabs";

export function CommunityFloatingTopBar() {
  return (
    <FloatingPageBar
      left={
        <>
          <FloatingPageTitle>Community</FloatingPageTitle>
          <CommunityDestinationTabs />
        </>
      }
    />
  );
}
