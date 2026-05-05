import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminModerationPageClient = dynamic(() => import("./moderation-page-client"), {
  loading: () => <RouteChunkFallback />,
  ssr: true,
});

export default function AdminModerationPage() {
  return <AdminModerationPageClient />;
}
