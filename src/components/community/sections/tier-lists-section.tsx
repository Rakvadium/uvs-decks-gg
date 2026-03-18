import Link from "next/link";
import { TierListFeed } from "@/components/community/tier-lists/feed";
import { TierListsFeatureBoundary } from "@/components/community/tier-lists/feature-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CommunityTierListsSection() {
  return (
    <TierListsFeatureBoundary
      fallback={
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-display font-bold uppercase tracking-[0.18em]">Tier Lists</h2>
            <p className="text-sm text-muted-foreground">
              Public rankings from the community, ready for likes, comments, and side-by-side debate.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tier lists are warming up</CardTitle>
              <CardDescription>
                This community module is temporarily unavailable, but the rest of the community page is still live.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/community/creators">Explore creator updates</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      }
    >
      <TierListFeed
        title="Tier Lists"
        description="Public rankings from the community, ready for likes, comments, and side-by-side debate."
        limit={3}
        compact
      />
    </TierListsFeatureBoundary>
  );
}
