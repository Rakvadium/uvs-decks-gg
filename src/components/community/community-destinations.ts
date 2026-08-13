import { BarChart3, ListOrdered, Sparkles, type LucideIcon } from "lucide-react";

export type CommunityDestinationValue = "hub" | "tier-lists" | "rankings" | "creators";

export type CommunityDestination = {
  value: Exclude<CommunityDestinationValue, "hub">;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const COMMUNITY_DESTINATIONS: readonly CommunityDestination[] = [
  { value: "tier-lists", label: "Tier Lists", href: "/community/tier-lists", icon: ListOrdered },
  { value: "rankings", label: "Rankings", href: "/community/tier-lists?tab=rankings", icon: BarChart3 },
  { value: "creators", label: "Creators", href: "/community/creators", icon: Sparkles },
] as const;

export function communityDestinationFromLocation(
  pathname: string,
  searchParams?: { get: (key: string) => string | null } | null,
): CommunityDestinationValue {
  if (pathname.startsWith("/community/creators")) return "creators";
  if (pathname.startsWith("/community/tier-lists")) {
    if (searchParams?.get("tab") === "rankings") return "rankings";
    return "tier-lists";
  }
  return "hub";
}
