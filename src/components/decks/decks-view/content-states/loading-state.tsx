import { Spinner } from "@/components/ui/spinner";

export function DecksLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" className="text-primary drop-shadow-[0_0_10px_var(--primary)]" />
        <span className="chrome-label-case text-sm text-muted-foreground">
          Initializing Deck Database
        </span>
      </div>
    </div>
  );
}
