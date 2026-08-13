"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FloatingTabsPill } from "@/components/shell/floating-page-bar";
import {
  COMMUNITY_DESTINATIONS,
  communityDestinationFromLocation,
} from "./community-destinations";

export function CommunityDestinationTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const value = communityDestinationFromLocation(pathname, searchParams);

  return (
    <FloatingTabsPill
      value={value}
      onValueChange={(next) => {
        const dest = COMMUNITY_DESTINATIONS.find((item) => item.value === next);
        if (dest) router.push(dest.href);
      }}
      items={COMMUNITY_DESTINATIONS.map((item) => ({
        value: item.value,
        label: item.label,
        icon: item.icon,
        hideLabelBelowLg: false,
      }))}
    />
  );
}
