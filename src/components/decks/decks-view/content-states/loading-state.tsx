import { Loader2 } from "lucide-react";

export function DecksLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary drop-shadow-[0_0_10px_var(--primary)]" />
        <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
          Initializing Deck Database
        </span>
      </div>
    </div>
  );
}
