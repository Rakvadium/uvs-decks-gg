import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const NewFormatPageClient = dynamic(() => import("./new-format-page-client"), {
  loading: () => <RouteChunkFallback />,
  ssr: true,
});

export default function NewFormatPage() {
  return <NewFormatPageClient />;
}
