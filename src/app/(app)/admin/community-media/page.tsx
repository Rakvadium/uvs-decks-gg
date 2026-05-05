import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const CommunityMediaPageClient = dynamic(
  () => import("./community-media-page-client"),
  {
    loading: () => <RouteChunkFallback />,
    ssr: true,
  }
);

export default function AdminCommunityMediaPage() {
  return <CommunityMediaPageClient />;
}
