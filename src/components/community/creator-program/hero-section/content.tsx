import { PageHeading } from "@/components/ui/typography-headings";
import { CreatorProgramHeroActions } from "./actions";
import { CreatorProgramHeroBadges } from "./badges";
import { CreatorProgramHeroSpotlightCard } from "./spotlight-card";
import { CreatorProgramHeroStatsGrid } from "./stats-grid";

export function CreatorProgramHeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <div className="pointer-events-none absolute inset-0 holo-shimmer opacity-30" />

      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <CreatorProgramHeroBadges />

          <div className="space-y-4">
            <PageHeading className="text-glow-cyan text-3xl font-display font-bold uppercase tracking-[0.15em] md:text-5xl">
              Build with the community. Publish like a creator.
            </PageHeading>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Verified creators get a broadcast-ready toolkit: post updates, sync video drops, run community labs, and
              spotlight standout decks. Apply once you have a track record of decks, guides, or recurring content.
            </p>
          </div>

          <CreatorProgramHeroActions />
          <CreatorProgramHeroStatsGrid />
        </div>

        <CreatorProgramHeroSpotlightCard />
      </div>
    </section>
  );
}
