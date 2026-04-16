import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { CommunityTierListDetailView } from "@/components/community/tier-lists/detail-view";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

type PageProps = {
  params: Promise<{ tierListId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tierListId } = await params;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return {
      title: "Tier list",
      description: "View a community UniVersus tier list on UVSDECKS.GG.",
    };
  }
  try {
    const detail = await fetchQuery(api.tierLists.getDetail, {
      tierListId: tierListId as Id<"tierLists">,
    });
    if (!detail) {
      return {
        title: "Tier list",
        description: "This tier list is private or could not be found.",
      };
    }
    const desc =
      detail.tierList.description?.trim() ||
      `UniVersus tier list "${detail.tierList.title}" — community rankings on UVSDECKS.GG.`;
    return {
      title: detail.tierList.title,
      description: desc,
    };
  } catch {
    return {
      title: "Tier list",
      description: "View a community UniVersus tier list on UVSDECKS.GG.",
    };
  }
}

export default function CommunityTierListDetailPage() {
  return <CommunityTierListDetailView />;
}
