import { PageHeading } from "@/components/ui/typography-headings";

export function CommunityTierListsPageHeading() {
  return (
    <div className="space-y-1">
      <PageHeading>Tier lists</PageHeading>
      <p className="text-sm tracking-wide text-muted-foreground">
        Browse public lists, manage yours, and explore community rankings
      </p>
    </div>
  );
}
