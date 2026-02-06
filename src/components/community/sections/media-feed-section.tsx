import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VIDEO_FEED } from "../community-content-data";

export function CommunityMediaFeedSection() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-[0.18em]">
            Community Media Feed
          </h2>
          <p className="text-sm text-muted-foreground">
            Clips, deck techs, and event recaps from the community.
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All Videos
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {VIDEO_FEED.map((video) => (
          <div
            key={video.title}
            className="hover-lift min-w-[260px] max-w-[320px] flex-1 rounded-xl border border-border/60 bg-card/60 p-4"
          >
            <div
              className={cn(
                "relative mb-4 aspect-video overflow-hidden rounded-lg border border-border/50 bg-background/60",
                "shadow-[0_0_20px_-10px_var(--primary)/30]"
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", video.accent)} />
              <div className="scanlines absolute inset-0 opacity-30" />

              <div className="absolute right-3 top-3">
                <Badge variant="secondary" className="text-[9px]">
                  {video.label}
                </Badge>
              </div>

              <div className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {video.duration}
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/50 bg-background/70">
                  <Play className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold leading-snug">{video.title}</p>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <span>{video.creator}</span>
                <span>{video.views} views</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
