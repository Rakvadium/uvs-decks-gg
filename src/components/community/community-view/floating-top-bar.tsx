"use client";

import { BarChart3, ListOrdered, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FloatingPageBar, FloatingTabsPill } from "@/components/shell/floating-page-bar";

const DESTINATIONS = [
  { value: "tier-lists", label: "Tier Lists", href: "/community/tier-lists", icon: ListOrdered },
  { value: "rankings", label: "Rankings", href: "/community/tier-lists?tab=rankings", icon: BarChart3 },
  { value: "creators", label: "Creators", href: "/community/creators", icon: Sparkles },
] as const;

function destinationFromPath(pathname: string): string {
  if (pathname.startsWith("/community/creators")) return "creators";
  if (pathname.startsWith("/community/tier-lists")) return "tier-lists";
  return "hub";
}

export function CommunityFloatingTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const value = destinationFromPath(pathname);

  return (
    <FloatingPageBar
      left={
        <FloatingTabsPill
          value={value}
          onValueChange={(next) => {
            const dest = DESTINATIONS.find((item) => item.value === next);
            if (dest) router.push(dest.href);
          }}
          items={DESTINATIONS.map((item) => ({
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
