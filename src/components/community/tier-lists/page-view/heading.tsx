import { PageHeading } from "@/components/ui/typography-headings";

export function CommunityTierListsPageHeading() {
  return (
    <div className="space-y-1">
      <PageHeading className="font-display text-2xl font-bold uppercase tracking-widest">Tier lists</PageHeading>
      <p className="font-mono text-sm tracking-wide text-muted-foreground">
        Browse public lists, manage yours, and explore community rankings
      </p>
    </div>
  );
}
