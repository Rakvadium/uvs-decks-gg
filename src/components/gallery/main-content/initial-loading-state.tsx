import { Database } from "lucide-react";

export function GalleryInitializationState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary/30 bg-primary/5">
          <Database className="h-8 w-8 animate-pulse text-primary" />
        </div>
        <div className="absolute -inset-4 animate-pulse rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-xl" />
      </div>
      <div className="space-y-2 text-center">
        <p className="font-display font-semibold uppercase tracking-widest">Initializing Database</p>
        <p className="text-sm font-mono tracking-wide text-muted-foreground">Loading card data...</p>
      </div>
    </div>
  );
}
