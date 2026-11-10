"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { useGameFeatures } from "@/games/game-context";
import {
  communityDestinationFromLocation,
  communityDestinationsFor,
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
  const destinations = communityDestinationsFor(useGameFeatures());
  if (destinations.length === 0) return null;

  return (
    <nav className={cn("min-w-0 md:hidden", className)} aria-label="Community destinations">
      <SegmentedControl
        size="sm"
        stretch
        className="w-full bg-muted/30"
        itemClassName="h-10"
        value={value === "hub" ? undefined : value}
        onValueChange={(next) => {
          const dest = destinations.find((item) => item.value === next);
          if (dest) router.push(dest.href);
        }}
        items={destinations.map((item) => ({
          value: item.value,
          label: <span>{item.label}</span>,
          icon: item.icon,
        }))}
      />
    </nav>
  );
}
