"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import {
  COMMUNITY_DESTINATIONS,
  communityDestinationFromLocation,
} from "./community-destinations";

type CommunityMobileDestinationNavProps = {
  className?: string;
};

export function CommunityMobileDestinationNav({
  className,
}: CommunityMobileDestinationNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const value = communityDestinationFromLocation(pathname, searchParams);

  return (
    <nav className={cn("min-w-0", className)} aria-label="Community destinations">
      <SegmentedControl
        size="sm"
        className="w-max min-w-0 max-w-none"
        value={value === "hub" ? undefined : value}
        onValueChange={(next) => {
          const dest = COMMUNITY_DESTINATIONS.find((item) => item.value === next);
          if (dest) router.push(dest.href);
        }}
        items={COMMUNITY_DESTINATIONS.map((item) => ({
          value: item.value,
          label: <span>{item.label}</span>,
          icon: item.icon,
        }))}
      />
    </nav>
  );
}
