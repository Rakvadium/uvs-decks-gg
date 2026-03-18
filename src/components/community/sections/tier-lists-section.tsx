import { TierListFeed } from "@/components/community/tier-lists/feed";

export function CommunityTierListsSection() {
  return (
    <TierListFeed
      title="Tier Lists"
      description="Public rankings from the community, ready for likes, comments, and side-by-side debate."
      limit={3}
      compact
    />
  );
}
