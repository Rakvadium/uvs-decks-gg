"use client";

import { useMemo } from "react";
import { ListOrdered } from "lucide-react";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { CommunityTierListsSidebarFooter } from "./tier-lists-panel-footer";
import { CommunityTierListsSidebarPanel } from "./tier-lists-panel";

export function CommunityRightSidebarSlots() {
  const tierListsOptions = useMemo(
    () => ({
      label: "Tier Lists",
      icon: ListOrdered,
      priority: 0,
      footer: CommunityTierListsSidebarFooter,
    }),
    []
  );

  useRegisterSlot("right-sidebar", "community-tier-lists", CommunityTierListsSidebarPanel, tierListsOptions);

  return null;
}
