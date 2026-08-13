"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FloatingPageBar, FloatingTabsPill } from "@/components/shell/floating-page-bar";
import {
  COMMUNITY_DESKTOP_DESTINATIONS,
  communityDestinationFromLocation,
} from "../community-destinations";

export function CommunityFloatingTopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const value = communityDestinationFromLocation(pathname, searchParams);

  return (
    <FloatingPageBar
      left={
        <FloatingTabsPill
          value={value}
          onValueChange={(next) => {
            const dest = COMMUNITY_DESKTOP_DESTINATIONS.find((item) => item.value === next);
            if (dest) router.push(dest.href);
          }}
          items={COMMUNITY_DESKTOP_DESTINATIONS.map((item) => ({
            value: item.value,
            label: item.label,
            icon: item.icon,
            hideLabelBelowLg: false,
          }))}
        />
      }
    />
  );
}
