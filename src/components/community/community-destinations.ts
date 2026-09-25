import { BarChart3, Home, ListOrdered, Sparkles, type LucideIcon } from "lucide-react";
import { isGameFeatureEnabled, type GameFeatureKey, type GameFeatures } from "@shared/games/features";

export type CommunityDestinationValue = "hub" | "tier-lists" | "rankings" | "creators";

export type CommunityDestination = {
  value: Exclude<CommunityDestinationValue, "hub">;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const COMMUNITY_HUB_DESTINATION = {
  value: "hub" as const,
  label: "Hub",
  href: "/community",
  icon: Home,
};

export const COMMUNITY_DESTINATIONS: readonly CommunityDestination[] = [
  { value: "tier-lists", label: "Tier Lists", href: "/community/tier-lists", icon: ListOrdered },
  { value: "rankings", label: "Rankings", href: "/community/tier-lists?tab=rankings", icon: BarChart3 },
  { value: "creators", label: "Creators", href: "/community/creators", icon: Sparkles },
] as const;

const DESTINATION_FEATURE: Record<CommunityDestination["value"], GameFeatureKey> = {
  "tier-lists": "tierLists",
  rankings: "rankings",
  creators: "creators",
};

/** Community destination tabs a game ships (`features` gate each tab). */
export function communityDestinationsFor(features: GameFeatures): CommunityDestination[] {
  return COMMUNITY_DESTINATIONS.filter((item) =>
    isGameFeatureEnabled(features, DESTINATION_FEATURE[item.value]),
  );
}

export const COMMUNITY_DESKTOP_DESTINATIONS = [
  COMMUNITY_HUB_DESTINATION,
  ...COMMUNITY_DESTINATIONS,
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
