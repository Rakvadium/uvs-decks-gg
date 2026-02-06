import { CommunityFeaturedBuildersPanel } from "./featured-builders";
import { CommunityPulseCard } from "./pulse-card";

export function CommunityBuildersPulseSection() {
  return (
    <section id="community-pulse" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <CommunityFeaturedBuildersPanel />
      <div className="space-y-4">
        <CommunityPulseCard />
      </div>
    </section>
  );
}
