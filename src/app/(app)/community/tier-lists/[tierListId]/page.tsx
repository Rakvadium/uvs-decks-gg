import { CommunityTierListDetailView } from "@/components/community/tier-lists/detail-view";

export default async function CommunityTierListDetailPage({
  params,
}: {
  params: Promise<{ tierListId: string }>;
}) {
  const { tierListId } = await params;
  return <CommunityTierListDetailView tierListId={tierListId} />;
}
