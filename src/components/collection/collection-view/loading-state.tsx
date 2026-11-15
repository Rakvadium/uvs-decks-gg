import { Spinner } from "@/components/ui/spinner";

export function CollectionViewLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" className="text-muted-foreground" />
    </div>
  );
}
