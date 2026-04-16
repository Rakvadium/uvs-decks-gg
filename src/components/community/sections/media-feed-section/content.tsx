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
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
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
      <div className="grid gap-4">
        {[0, 1, 2].map((key) => (
          <Card key={key} className="overflow-hidden border-border/60 bg-background/50 shadow-none">
            <CardContent className="p-0">
              <div className="grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]">
                <Skeleton className="min-h-[140px] rounded-none sm:min-h-[140px]" />
                <div className="flex min-w-0 flex-col justify-between gap-4 p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
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

        <div className="grid gap-4">
          {feed.items.map((video, index) => (
            <Card
              key={video.youtubeVideoId}
              className={cn(
                "overflow-hidden border-border/60 bg-background/50 shadow-none transition-[box-shadow]",
                video.youtubeVideoId === resolvedActiveId &&
                  "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
              )}
            >
              <CardContent className="p-0">
                <div className="grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <button
                    type="button"
                    onClick={() => setActiveVideoId(video.youtubeVideoId)}
                    className={cn(
                      "relative block min-h-[140px] w-full cursor-pointer overflow-hidden border-b border-border/50 text-left sm:border-b-0 sm:border-r",
                      "bg-gradient-to-br outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      video.accentClass ?? "from-secondary/20 via-secondary/5 to-transparent"
                    )}
                  >
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title ?? "Video thumbnail"}
                        fill
                        className="object-cover opacity-80"
                        sizes="160px"
                      />
                    ) : null}
                    <div className={cn("absolute inset-0 opacity-20", scanlineClass)} />
                    <div className="absolute left-3 top-3">
                      {video.editorialLabel ? (
                        <Badge variant="secondary" className="bg-background/75 text-[9px] uppercase tracking-[0.2em]">
                          {video.editorialLabel}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-background/75">
                      <Play className="h-4 w-4 text-primary" />
                    </div>
                    <span className="sr-only">Play {video.title ?? "video"} in the main player</span>
                  </button>

                  <div className="flex min-w-0 flex-col justify-between gap-4 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                        <span>{index === 0 ? "Featured" : `Queue ${index}`}</span>
                        <span>
                          {video.rowStatus === "ok"
                            ? video.durationLabel
                            : video.rowStatus === "pending"
                              ? "—"
                              : "—"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <SectionHeading className="text-sm font-semibold leading-snug text-foreground">
                          {video.title ??
                            (video.rowStatus === "error" ? "Could not load video" : "Loading…")}
                        </SectionHeading>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {video.rowStatus === "ok" ? (
                            <>
                              {video.channelTitle} / {video.viewCountLabel} views
                            </>
                          ) : video.rowStatus === "pending" ? (
                            <>Fetching from YouTube…</>
                          ) : (
                            <span className="normal-case tracking-normal text-destructive/90">
                              {video.fetchError ?? "Error"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <a
                      href={video.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.22em] text-primary transition-colors hover:text-primary/80"
                    >
                      Watch on YouTube
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
