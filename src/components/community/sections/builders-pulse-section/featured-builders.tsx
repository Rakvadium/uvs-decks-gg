import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FEATURED_BUILDERS } from "../../community-content-data";
import { CommunitySectionHeader } from "../../shared/section-header";

function FeaturedBuilderCard({ index }: { index: number }) {
  const creator = FEATURED_BUILDERS[index];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-4">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", creator.accent)} />

      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border/60 bg-background/70">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 font-display text-xs font-bold uppercase">{creator.name.slice(0, 2)}</div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{creator.name}</p>
                <Badge variant="secondary" className="text-[9px]">
                  Featured
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{creator.handle}</p>
            </div>
          </div>

          <Badge variant="outline" className="text-[9px]">
            {creator.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{creator.focus}</span>
          <span>{creator.activity}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {creator.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[9px]">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{creator.cadence}</span>
          <Button variant="ghost" size="sm">
            View Profile
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CommunityFeaturedBuildersPanel() {
  return (
    <div className="space-y-4">
      <CommunitySectionHeader
        title="Featured Builders"
        description="Community members shaping the next wave of decks and strategies."
        action={
          <Button variant="cyber" size="sm">
            View More Builders
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {FEATURED_BUILDERS.map((creator, index) => (
          <FeaturedBuilderCard key={creator.handle} index={index} />
        ))}
      </div>
    </div>
  );
}
