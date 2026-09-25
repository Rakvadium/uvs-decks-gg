import { Suspense } from "react";
import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminSetImportPageClient = dynamic(
  () => import("./set-import-page-client"),
  { loading: () => <RouteChunkFallback />, ssr: true }
);

export default function AdminSetImportPage() {
  return (
    <Suspense fallback={<RouteChunkFallback />}>
      <AdminSetImportPageClient />
    </Suspense>
  );
}