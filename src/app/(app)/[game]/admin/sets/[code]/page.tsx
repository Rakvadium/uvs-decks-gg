import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminSetDetailPageClient = dynamic(
  () => import("./set-detail-page-client"),
  { loading: () => <RouteChunkFallback />, ssr: true }
);

export default function AdminSetDetailPage() {
  return <AdminSetDetailPageClient />;
}
