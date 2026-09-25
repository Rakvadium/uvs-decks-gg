import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminSetCardsPageClient = dynamic(
  () => import("./set-cards-page-client"),
  { loading: () => <RouteChunkFallback />, ssr: true }
);

export default function AdminSetCardsPage() {
  return <AdminSetCardsPageClient />;
}
