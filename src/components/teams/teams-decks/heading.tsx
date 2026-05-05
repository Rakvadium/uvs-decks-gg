import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/typography-headings";

type TeamsDecksHeadingProps = {
  title: string;
  description: ReactNode;
};

export function TeamsDecksHeading({ title, description }: TeamsDecksHeadingProps) {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5"
        style={{ filter: "var(--chrome-decks-heading-blur)" }}
      />

      <div className="relative space-y-1">
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 rounded-full bg-primary"
            style={{
              boxShadow: "var(--chrome-decks-heading-dot-shadow)",
              animation: "var(--chrome-decks-heading-dot-animation)",
            }}
          />
          <PageHeading className="font-display text-2xl font-bold uppercase tracking-widest">{title}</PageHeading>
        </div>
        <div className="pl-5 font-mono text-sm tracking-wide text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
