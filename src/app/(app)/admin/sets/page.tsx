import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminSetsPageClient = dynamic(() => import("./sets-page-client"), {
  loading: () => <RouteChunkFallback />,
  ssr: true,
});

export default function AdminSetsPage() {
  return <AdminSetsPageClient />;
}
