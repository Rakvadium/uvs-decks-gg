import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const TierListsPageClient = dynamic(() => import("./tier-lists-page-client"), {
  loading: () => <RouteChunkFallback />,
  ssr: true,
});

export default function CommunityTierListsPage() {
  return <TierListsPageClient />;
}
