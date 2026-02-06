export function DecksViewHeading() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 blur-xl" />

      <div className="relative space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest">Deck Database</h1>
        </div>
        <p className="pl-5 font-mono text-sm tracking-wide text-muted-foreground">
          Build, browse, and manage decks
        </p>
      </div>
    </div>
  );
}
