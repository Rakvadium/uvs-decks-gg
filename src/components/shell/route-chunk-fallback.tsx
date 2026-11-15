import { LoadingState } from "@/components/ui/loading-state";

export function RouteChunkFallback() {
  return <LoadingState size="lg" className="h-full min-h-[40vh] w-full p-6" />;
}
