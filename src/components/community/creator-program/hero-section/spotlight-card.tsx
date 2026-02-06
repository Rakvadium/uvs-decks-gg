import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CreatorProgramHeroSpotlightCard() {
  return (
    <Card className="border-glow bg-background/70">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">Creator Spotlight</CardTitle>
        <CardDescription>Featured creator profiles and weekly drops.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-primary/40 bg-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 text-xs font-display font-bold uppercase">NE</div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">NovaEdge</p>
              <Badge variant="secondary" className="text-[9px]">
                Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Meta Briefings • 48k followers</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px]">
            Meta Briefing
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            Deck Spotlight
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            Matchup Lab
          </Badge>
        </div>

        <Button variant="neon-magenta" size="sm" className="w-full">
          View Creator Profile
        </Button>
      </CardContent>
    </Card>
  );
}
