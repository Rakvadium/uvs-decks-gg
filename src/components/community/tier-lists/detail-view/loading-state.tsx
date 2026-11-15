import { Spinner } from "@/components/ui/spinner";

export function CommunityTierListDetailLoadingState() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Spinner size="md" className="text-muted-foreground" />
    </div>
  );
}
