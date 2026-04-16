import { PageHeading } from "@/components/ui/typography-headings";

export function DecksViewHeading() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" style={{ filter: "var(--chrome-decks-heading-blur)" }} />

      <div className="relative space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary" style={{ boxShadow: "var(--chrome-decks-heading-dot-shadow)", animation: "var(--chrome-decks-heading-dot-animation)" }} />
          <PageHeading className="font-display text-2xl font-bold uppercase tracking-widest">Deck Database</PageHeading>
        </div>
        <p className="pl-5 font-mono text-sm tracking-wide text-muted-foreground">
          Build, browse, and manage decks
        </p>
      </div>
    </div>
  );
}
