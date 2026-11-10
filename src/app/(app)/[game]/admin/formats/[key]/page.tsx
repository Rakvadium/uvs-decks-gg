import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminFormatDetailPageClient = dynamic(
  () => import("./format-detail-page-client"),
  { loading: () => <RouteChunkFallback />, ssr: true }
);

export default function AdminFormatDetailPage() {
  return <AdminFormatDetailPageClient />;
}
