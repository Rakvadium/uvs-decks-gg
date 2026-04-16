import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { fetchQuery } from "convex/nextjs";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

const CommunityTierListDetailView = dynamic(
  () =>
    import("@/components/community/tier-lists/detail-view").then((m) => ({
      default: m.CommunityTierListDetailView,
    })),
  { loading: () => <RouteChunkFallback />, ssr: true }
);

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
  return (
    <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden p-3 md:p-6">
      <CommunityTierListDetailView />
    </div>
  );
}
