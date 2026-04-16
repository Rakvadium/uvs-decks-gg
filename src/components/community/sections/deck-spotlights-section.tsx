import Link from "next/link";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/typography-headings";

export function CommunityDeckSpotlightsSection() {
  const publicDecks = useQuery(api.decks.listPublic, {});
  const isLoadingDecks = publicDecks === undefined;
  const deckSpotlights = (publicDecks ?? []).slice(0, 6);

  return (
    <section id="deck-spotlights" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionHeading className="text-xl font-display font-bold uppercase tracking-[0.18em]">
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
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : deckSpotlights.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No public decks available yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first to share your deck with the community!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deckSpotlights.map((deck, index) => (
            <Link key={deck._id} href={`/decks/${deck._id}`}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-accent/40">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge tone="entity" className="text-[9px]">
                      Spotlight
                    </Badge>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
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
