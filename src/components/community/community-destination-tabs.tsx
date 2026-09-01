"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FloatingTabsPill } from "@/components/shell/floating-page-bar";
import {
  COMMUNITY_DESKTOP_DESTINATIONS,
  communityDestinationFromLocation,
} from "./community-destinations";

export function CommunityDestinationTabs({ compact = false }: { compact?: boolean } = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const value = communityDestinationFromLocation(pathname, searchParams);

  return (
    <FloatingTabsPill
      value={value}
      onValueChange={(next) => {
        const dest = COMMUNITY_DESKTOP_DESTINATIONS.find((item) => item.value === next);
        if (dest) router.push(dest.href);
      }}
      items={COMMUNITY_DESKTOP_DESTINATIONS.map((item) => ({
        value: item.value,
        label: compact ? <span className="sr-only">{item.label}</span> : item.label,
        icon: item.icon,
        hideLabelBelowLg: false,
      }))}
    />
  );
}
