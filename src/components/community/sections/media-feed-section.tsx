"use client";

import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useChromeMode } from "@/lib/theme";
import { VIDEO_FEED } from "../community-content-data";
import { CommunitySectionHeader } from "../shared/section-header";
import { SectionHeading } from "@/components/ui/typography-headings";

export function CommunityMediaFeedSection() {
  const chrome = useChromeMode();
  const scanlineClass = chrome === "expressive" ? "scanlines" : "";
  const [featuredVideo, ...supportingVideos] = VIDEO_FEED;

  return (
    <section id="universus-content" className="space-y-5 scroll-mt-24">
      <CommunitySectionHeader
        title="UniVersus Content"
        description="Deck tech, matches, and event recaps from the UniVersus scene in one feed."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/community/creators">Creator program</Link>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden border-border/60 bg-background/50 shadow-none">
          <CardContent className="p-0">
            <div
              className={cn(
                "relative flex min-h-[320px] flex-col justify-between overflow-hidden p-6 md:min-h-[360px] md:p-7",
                "bg-gradient-to-br from-background via-background to-card"
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", featuredVideo.accent)} />
              <div className={cn("absolute inset-0 opacity-20", scanlineClass)} />
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <Badge variant="secondary" className="border border-border/50 bg-background/70 text-[10px] uppercase tracking-[0.22em]">
                  Featured drop
                </Badge>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                  {featuredVideo.duration} / {featuredVideo.views} views
                </div>
              </div>

              <div className="relative space-y-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-background/75 shadow-[var(--chrome-elevation-mid)]">
                  <Play className="h-6 w-6 text-primary" />
                </div>

                <div className="max-w-2xl space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-background/70">
                      {featuredVideo.label}
                    </Badge>
                    <Badge variant="outline" className="bg-background/70">
                      {featuredVideo.creator}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <SectionHeading className="max-w-xl text-2xl font-semibold leading-tight text-foreground md:text-3xl">
                      {featuredVideo.title}
                    </SectionHeading>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                      Start here for the biggest recent community update, then scan the queue for the rest of the highlights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {supportingVideos.map((video, index) => (
            <Card key={video.title} className="overflow-hidden border-border/60 bg-background/50 shadow-none">
              <CardContent className="p-0">
                <div className="grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div className={cn("relative min-h-[140px] overflow-hidden border-b border-border/50 sm:border-b-0 sm:border-r", "bg-gradient-to-br", video.accent)}>
                    <div className={cn("absolute inset-0 opacity-20", scanlineClass)} />
                    <div className="absolute left-3 top-3">
                      <Badge variant="secondary" className="bg-background/75 text-[9px] uppercase tracking-[0.2em]">
                        {video.label}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-background/75">
                      <Play className="h-4 w-4 text-primary" />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col justify-between gap-4 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                        <span>Queue {index + 1}</span>
                        <span>{video.duration}</span>
                      </div>
                      <div className="space-y-2">
                        <SectionHeading className="text-sm font-semibold leading-snug text-foreground">{video.title}</SectionHeading>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {video.creator} / {video.views} views
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/community/creators"
                      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.22em] text-primary transition-colors hover:text-primary/80"
                    >
                      Meet creators
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
