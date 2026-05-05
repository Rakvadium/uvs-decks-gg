import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminFormatsPageClient = dynamic(
  () => import("./formats-page-client"),
  { loading: () => <RouteChunkFallback />, ssr: true }
);

export default function AdminFormatsPage() {
  return <AdminFormatsPageClient />;
}
