"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FloatingTabsPill } from "@/components/shell/floating-page-bar";
import { useGameFeatures } from "@/games/game-context";
import {
  communityDestinationFromLocation,
  communityDestinationsFor,
} from "./community-destinations";

export function CommunityDestinationTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const value = communityDestinationFromLocation(pathname, searchParams);
  const destinations = communityDestinationsFor(useGameFeatures());
  if (destinations.length === 0) return null;

  return (
    <FloatingTabsPill
      value={value}
      onValueChange={(next) => {
        const dest = destinations.find((item) => item.value === next);
        if (dest) router.push(dest.href);
      }}
      items={destinations.map((item) => ({
        value: item.value,
        label: item.label,
        icon: item.icon,
        hideLabelBelowLg: false,
      }))}
    />
  );
}
