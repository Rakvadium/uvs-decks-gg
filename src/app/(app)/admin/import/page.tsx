import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminImportPageClient = dynamic(() => import("./import-page-client"), {
  loading: () => <RouteChunkFallback />,
  ssr: true,
});

export default function AdminImportPage() {
  return <AdminImportPageClient />;
}
