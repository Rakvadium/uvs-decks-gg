import Link from "next/link";
import { TierListFeed } from "@/components/community/tier-lists/feed";
import { TierListsFeatureBoundary } from "@/components/community/tier-lists/feature-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunitySectionHeader } from "../shared/section-header";

export function CommunityTierListsSection() {
  return (
    <TierListsFeatureBoundary
      fallback={
        <section id="tier-lists" className="space-y-4 scroll-mt-24">
          <CommunitySectionHeader
            title="Tier Lists"
            description="Public rankings from the community, ready for likes, comments, and side-by-side debate."
          />
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
      <section id="tier-lists" className="scroll-mt-24">
        <TierListFeed
          title="Tier Lists"
          description="Public rankings from the community, ready for likes, comments, and side-by-side debate."
          limit={4}
          action={
            <Button variant="outline" asChild>
              <Link href="/community/rankings">View Community Rankings</Link>
            </Button>
          }
        />
      </section>
    </TierListsFeatureBoundary>
  );
}
