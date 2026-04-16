import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminCardsPageClient = dynamic(() => import("./cards-page-client"), {
  loading: () => <RouteChunkFallback />,
  ssr: true,
});

export default function AdminCardsPage() {
  return <AdminCardsPageClient />;
}
