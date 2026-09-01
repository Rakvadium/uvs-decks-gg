"use client";

import { FloatingPageBar } from "@/components/shell/floating-page-bar";
import { CommunityDestinationTabs } from "../community-destination-tabs";

export function CommunityFloatingTopBar() {
  return (
    <FloatingPageBar
      left={<CommunityDestinationTabs />}
    />
  );
}
