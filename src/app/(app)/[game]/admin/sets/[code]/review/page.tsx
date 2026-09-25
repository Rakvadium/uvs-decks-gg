import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminSetReviewPageClient = dynamic(
  () => import("./set-review-page-client"),
  { loading: () => <RouteChunkFallback />, ssr: true }
);

export default function AdminSetReviewPage() {
  return <AdminSetReviewPageClient />;
}
