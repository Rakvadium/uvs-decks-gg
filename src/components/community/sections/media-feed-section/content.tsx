"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowUpRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChromeMode } from "@/lib/theme";
import { CommunitySectionHeader } from "../../shared/section-header";
import { SectionHeading } from "@/components/ui/typography-headings";
import { useCommunityMediaFeedModel } from "./hook";
import { YoutubeEmbed } from "./youtube-embed";

function MediaFeedSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
      <Card className="overflow-hidden border-border/60 bg-background/50 shadow-none">
        <CardContent className="p-0">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-5 p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-10 w-full max-w-xl" />
              <Skeleton className="h-16 w-full max-w-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col rounded-lg border border-border/60 bg-background/50">
        {[0, 1, 2].map((key) => (
          <div key={key} className="flex items-center gap-3 border-b border-border/30 px-3 py-2 last:border-b-0">
            <div className="w-28 shrink-0">
              <Skeleton className="aspect-video w-full rounded-md" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommunityMediaFeedSection() {
  const chrome = useChromeMode();
  const scanlineClass = chrome === "expressive" ? "scanlines" : "";
  const { feed } = useCommunityMediaFeedModel();

  const featuredId =
    feed !== undefined && feed.items.length > 0 ? feed.items[0].youtubeVideoId : null;

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (featuredId !== null) {
      setActiveVideoId(featuredId);
    }
  }, [featuredId]);

  if (feed === undefined) {
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
        <MediaFeedSkeleton />
        <AttributionFooter />
      </section>
    );
  }

  if (feed.feedKind === "empty" || feed.items.length === 0) {
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
        <Card className="border-border/60 bg-background/50 shadow-none">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              The video queue is not available yet. Check back soon.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://www.youtube.com/@UniVersusCCG"
                target="_blank"
                rel="noopener noreferrer"
              >
                UniVersus on YouTube
                <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
        <AttributionFooter />
      </section>
    );
  }

  const featuredVideo = feed.items[0]!;
  const resolvedActiveId = activeVideoId ?? featuredVideo.youtubeVideoId;
  const activeVideo =
    feed.items.find((i) => i.youtubeVideoId === resolvedActiveId) ?? featuredVideo;
  const showDegraded =
    feed.feedKind === "partial" ||
    feed.feedKind === "error_all" ||
    feed.items.some((i) => i.rowStatus === "error");

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

      {feed.feedKind === "pending_all" ? (
        <p className="text-xs text-muted-foreground">
          Loading titles, channels, and thumbnails from YouTube… If this does not finish, set{" "}
          <span className="font-mono">YOUTUBE_DATA_API_KEY</span> for this deployment in the Convex environment
          settings.
        </p>
      ) : null}

      {showDegraded ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
          role="status"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Some video details could not be refreshed. Showing the latest saved data where available.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <Card className="overflow-hidden border-border/60 bg-background/50 shadow-none">
          <CardContent className="p-0">
            {activeVideo.rowStatus === "error" ? (
              <div className="relative flex aspect-video min-h-[200px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-background via-background to-card px-6 text-center">
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
                    activeVideo.accentClass ?? "from-primary/20 via-primary/5 to-transparent"
                  )}
                />
                <div className={cn("pointer-events-none absolute inset-0 opacity-20", scanlineClass)} />
                <p className="relative z-[1] text-sm text-muted-foreground">
                  {activeVideo.fetchError ?? "This video cannot be embedded right now."}
                </p>
                <Button variant="outline" size="sm" className="relative z-[1]" asChild>
                  <a href={activeVideo.watchUrl} target="_blank" rel="noopener noreferrer">
                    Open on YouTube
                    <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            ) : (
              <YoutubeEmbed
                key={activeVideo.youtubeVideoId}
                videoId={activeVideo.youtubeVideoId}
                title={activeVideo.title ?? "UniVersus community video"}
              />
            )}

            <div
              className={cn(
                "relative space-y-5 overflow-hidden p-6 md:p-7",
                "bg-gradient-to-br from-background via-background to-card"
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.35]",
                  activeVideo.accentClass ?? "from-primary/20 via-primary/5 to-transparent"
                )}
              />
              <div className={cn("pointer-events-none absolute inset-0 opacity-20", scanlineClass)} />
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

              <div className="relative z-[1] flex flex-wrap items-center justify-between gap-3">
                <Badge variant="secondary" className="border border-border/50 bg-background/70 text-[10px] uppercase tracking-[0.22em]">
                  {activeVideo.youtubeVideoId === featuredVideo.youtubeVideoId ? "Featured drop" : "Now playing"}
                </Badge>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                  {activeVideo.rowStatus === "ok" ? (
                    <>
                      {activeVideo.durationLabel} / {activeVideo.viewCountLabel} views
                    </>
                  ) : activeVideo.rowStatus === "pending" ? (
                    <>Loading details…</>
                  ) : (
                    <>Unavailable</>
                  )}
                </div>
              </div>

              <div className="relative z-[1] max-w-2xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {activeVideo.editorialLabel ? (
                    <Badge variant="outline" className="bg-background/70">
                      {activeVideo.editorialLabel}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="bg-background/70">
                    {activeVideo.rowStatus === "ok"
                      ? activeVideo.channelTitle
                      : activeVideo.rowStatus === "pending"
                        ? "YouTube"
                        : "Error"}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-mono uppercase tracking-[0.18em]" asChild>
                    <a href={activeVideo.watchUrl} target="_blank" rel="noopener noreferrer">
                      Open on YouTube
                      <ArrowUpRight className="ml-1 inline h-3 w-3" />
                    </a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <SectionHeading className="max-w-xl text-2xl font-semibold leading-tight text-foreground md:text-3xl">
                    {activeVideo.title ??
                      (activeVideo.rowStatus === "error"
                        ? "Video metadata unavailable"
                        : "Loading video…")}
                  </SectionHeading>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                    {activeVideo.rowStatus === "error" ? (
                      activeVideo.fetchError ? (
                        <span className="text-destructive/90">{activeVideo.fetchError}</span>
                      ) : (
                        <>The player could not load this video. Try Open on YouTube instead.</>
                      )
                    ) : (
                      <>
                        Watch in the player above, or pick another highlight from the queue. Use{" "}
                        <span className="font-medium text-foreground">Open on YouTube</span> if you prefer the
                        full site.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col rounded-lg border border-border/60 bg-background/50">
          {feed.items.map((video, index) => {
            const isActive = video.youtubeVideoId === resolvedActiveId;
            return (
              <button
                key={video.youtubeVideoId}
                type="button"
                onClick={() => setActiveVideoId(video.youtubeVideoId)}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-3 overflow-hidden px-3 py-2 text-left outline-none",
                  "border-b border-border/30 transition-colors last:border-b-0 last:rounded-b-lg first:rounded-t-lg",
                  "hover:bg-primary/[0.04] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive && "bg-primary/[0.06]"
                )}
              >
                <div className="relative w-28 shrink-0 overflow-hidden rounded-md">
                  <div className="aspect-video w-full">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title ?? "Video thumbnail"}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="112px"
                      />
                    ) : (
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br",
                          video.accentClass ?? "from-secondary/20 via-secondary/5 to-transparent"
                        )}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                      <Play
                        className={cn(
                          "h-5 w-5 text-white drop-shadow-md transition-opacity",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      />
                    </div>
                    {video.rowStatus === "ok" && video.durationLabel ? (
                      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-px font-mono text-[10px] leading-none text-white">
                        {video.durationLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p
                    className={cn(
                      "line-clamp-2 text-sm font-medium leading-snug transition-colors",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {video.title ??
                      (video.rowStatus === "error" ? "Could not load video" : "Loading…")}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="truncate">
                      {video.rowStatus === "ok"
                        ? video.channelTitle
                        : video.rowStatus === "pending"
                          ? "YouTube"
                          : "Error"}
                    </span>
                    {video.rowStatus === "ok" ? (
                      <>
                        <span className="shrink-0 text-muted-foreground/40">·</span>
                        <span className="shrink-0">{video.viewCountLabel} views</span>
                      </>
                    ) : null}
                  </div>
                  {video.editorialLabel ? (
                    <Badge variant="secondary" className="w-fit bg-primary/10 px-1.5 py-0 text-[9px] uppercase leading-4 tracking-[0.12em] text-primary">
                      {video.editorialLabel}
                    </Badge>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <AttributionFooter />
    </section>
  );
}

function AttributionFooter() {
  return (
    <footer className="border-t border-border/40 pt-4">
      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        Video information and thumbnails are sourced from{" "}
        <a
          href="https://www.youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          YouTube
        </a>{" "}
        via the YouTube Data API. Use is subject to the{" "}
        <a
          href="https://developers.google.com/youtube/terms/api-services-terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          YouTube API Services Terms of Service
        </a>
        . Learn more in{" "}
        <a
          href="https://www.youtube.com/howyoutubeworks"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          How YouTube works
        </a>
        .
      </p>
    </footer>
  );
}
