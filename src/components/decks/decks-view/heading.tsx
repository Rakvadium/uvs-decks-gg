import { PageHeading } from "@/components/ui/typography-headings";
import { DecksPagePrimaryAction } from "./top-bar";

export function DecksViewHeading() {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <PageHeading className="font-display text-2xl font-bold uppercase tracking-widest">Deck Database</PageHeading>
        <p className="font-mono text-sm tracking-wide text-muted-foreground">
          Build, browse, and manage decks
        </p>
      </div>
      <DecksPagePrimaryAction className="w-full justify-center" />
    </div>
  );
}
