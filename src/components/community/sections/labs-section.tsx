import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COMMUNITY_LABS, COMMUNITY_RESOURCES } from "../community-content-data";
import { CommunitySectionHeader } from "../shared/section-header";

export function CommunityLabsSection() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <CommunitySectionHeader
          title="Community Labs"
          description="Join collaborative spaces for tier ranking, deckbuilding, polls, and playtests."
        />

        <Card className="border-primary/20 bg-card/70">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">New: Tier List Lab</CardTitle>
            <CardDescription>
              Build private or public card rankings from cached set data, drag cards between custom lanes, and publish them to the
              community feed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/community/tier-lists">Open tier list maker</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/community/tier-lists">Browse shared rankings</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {COMMUNITY_LABS.map((tool) => {
            const Icon = tool.icon;

            return (
              <div key={tool.title} className="rounded-xl border border-border/60 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {tool.kicker}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/70">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-semibold">{tool.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{tool.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="border border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">Community Resources</CardTitle>
          <CardDescription>High-signal places to catch up fast.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {COMMUNITY_RESOURCES.map((resource) => {
            const Icon = resource.icon;

            return (
              <div key={resource.label} className="rounded-lg border border-border/60 bg-background/60 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-start gap-2">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-card/60">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider">{resource.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{resource.detail}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    {resource.cta}
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="rounded-lg border border-dashed border-border/60 bg-card/40 px-3 py-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <Trophy className="h-4 w-4 text-secondary" />
              Creator note
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Want to publish videos and posts here? The full requirements and application process are on the creator page.
            </p>
            <Link
              href="/community/creators"
              className="mt-3 inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-primary hover:underline"
            >
              Learn about creator verification
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
