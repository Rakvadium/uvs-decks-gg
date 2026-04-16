import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const SettingsPageClient = dynamic(() => import("./settings-page-client"), {
  loading: () => <RouteChunkFallback />,
  ssr: true,
});

export default function SettingsPage() {
  return <SettingsPageClient />;
}
