import Link from "next/link";
import { useQuery } from "convex/react";
import { Layers } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/typography-headings";
import { useGameId } from "@/games/game-context";

export function CommunityDeckSpotlightsSection() {
  const game = useGameId();
  const publicDecks = useQuery(api.decks.listPublic, { game });
  const isLoadingDecks = publicDecks === undefined;
  const deckSpotlights = (publicDecks ?? []).slice(0, 6);

  return (
    <section id="deck-spotlights" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionHeading size="lg">
            Deck Spotlights
          </SectionHeading>
          <p className="text-sm text-muted-foreground">
            Community-curated decks lighting up the ladder right now.
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All Decks
        </Button>
      </div>

      {isLoadingDecks ? (
        <Panel>
          <LoadingState label="Loading decks" />
        </Panel>
      ) : deckSpotlights.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No public decks available yet"
          description="Be the first to share your deck with the community!"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deckSpotlights.map((deck, index) => (
            <Link key={deck._id} href={`/decks/${deck._id}`}>
              <Card fx className="h-full cursor-pointer">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge size="sm" tone="entity">
                      Spotlight
                    </Badge>
                    <span className="chrome-label-case text-[10px] text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <CardTitle className="text-base">{deck.name}</CardTitle>
                  {deck.description ? (
                    <CardDescription className="line-clamp-2">{deck.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{deck.mainCardIds.length} cards</span>
                  <span>{deck.format ?? "Open format"}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
