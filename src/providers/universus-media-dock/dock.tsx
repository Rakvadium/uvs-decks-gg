"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useAction, useQuery } from "convex/react";
import {
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Minus,
  Play,
  Radio,
  Tv,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { YoutubeEmbed } from "@/components/community/sections/media-feed-section/youtube-embed";
import { useUniversusMediaDock, type UniversusDockPlayback, type UniversusDockPosition } from "./context";
import { TwitchStreamEmbed } from "./twitch-embed";

const DOCK_MARGIN = 8;
const DOCK_PANEL_BASE_WIDTH_CAP_PX = 352;
const DOCK_PANEL_WIDTH_GUTTER_PX = 24;
const DOCK_PANEL_MAX_HEIGHT_CAP_MD_PX = 640;
const DOCK_PANEL_MAX_HEIGHT_CAP_DEFAULT_PX = 576;
const DOCK_PANEL_MAX_HEIGHT_VH_MD = 0.92;
const DOCK_PANEL_MAX_HEIGHT_VH_DEFAULT = 0.88;
const DOCK_SCALE_MIN = 1;
const DOCK_SCALE_MAX = 2;

function getDockBaseWidthPx(): number {
  if (typeof window === "undefined") return DOCK_PANEL_BASE_WIDTH_CAP_PX;
  return Math.min(
    DOCK_PANEL_BASE_WIDTH_CAP_PX,
    Math.max(1, window.innerWidth - DOCK_PANEL_WIDTH_GUTTER_PX)
  );
}

function getDockBaseMaxHeightPxForSize(width: number, height: number): number {
  const isMd = width >= 768;
  if (isMd) {
    return Math.min(height * DOCK_PANEL_MAX_HEIGHT_VH_MD, DOCK_PANEL_MAX_HEIGHT_CAP_MD_PX);
  }
  return Math.min(height * DOCK_PANEL_MAX_HEIGHT_VH_DEFAULT, DOCK_PANEL_MAX_HEIGHT_CAP_DEFAULT_PX);
}

function clampDockToViewport(x: number, y: number, w: number, h: number): UniversusDockPosition {
  const maxX = Math.max(DOCK_MARGIN, window.innerWidth - w - DOCK_MARGIN);
  const maxY = Math.max(DOCK_MARGIN, window.innerHeight - h - DOCK_MARGIN);
  return {
    x: Math.min(Math.max(DOCK_MARGIN, x), maxX),
    y: Math.min(Math.max(DOCK_MARGIN, y), maxY),
  };
}

const DOCK_DRAG_IGNORE = "[data-dock-no-drag]";

function useDockDrag(
  elRef: RefObject<HTMLElement | null>,
  dockPosition: UniversusDockPosition | null,
  setDockPosition: (value: UniversusDockPosition | null) => void
) {
  const sessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    captureEl: Element;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      const t = e.target;
      if (t instanceof Element && t.closest(DOCK_DRAG_IGNORE)) return;
      const shell = elRef.current;
      if (!shell) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const r = shell.getBoundingClientRect();
      const originX = dockPosition?.x ?? r.left;
      const originY = dockPosition?.y ?? r.top;
      sessionRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX,
        originY,
        captureEl: e.currentTarget,
      };
    },
    [elRef, dockPosition]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const s = sessionRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      const shell = elRef.current;
      if (!shell) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      const r = shell.getBoundingClientRect();
      setDockPosition(clampDockToViewport(s.originX + dx, s.originY + dy, r.width, r.height));
    },
    [elRef, setDockPosition]
  );

  const end = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const s = sessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;
    sessionRef.current = null;
    try {
      s.captureEl.releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  return {
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}

function getFirstQueuePlayback(
  liveRows: Array<{ playback: UniversusDockPlayback }>,
  feed:
    | {
        feedKind: string;
        items: Array<{ youtubeVideoId: string; title?: string | null }>;
      }
    | undefined
): UniversusDockPlayback | null {
  if (liveRows.length > 0) return liveRows[0].playback;
  if (feed && feed.feedKind !== "empty" && feed.items.length > 0) {
    const v = feed.items[0];
    return { kind: "youtube-vod", videoId: v.youtubeVideoId, title: v.title ?? "Video" };
  }
  return null;
}

function playbackEquals(a: UniversusDockPlayback | null, b: UniversusDockPlayback | null) {
  if (a === null && b === null) return true;
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "twitch-live" && b.kind === "twitch-live")
    return a.channelLogin === b.channelLogin;
  if (
    (a.kind === "youtube-vod" || a.kind === "youtube-live") &&
    (b.kind === "youtube-vod" || b.kind === "youtube-live")
  )
    return a.videoId === b.videoId;
  return false;
}

export function UniversusMediaDock() {
  const {
    panelState,
    playback,
    setPlayback,
    dockPosition,
    setDockPosition,
    minimize,
    close,
  } = useUniversusMediaDock();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dockPosRef = useRef<UniversusDockPosition | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalContainer(document.body);
  }, []);

  useEffect(() => {
    dockPosRef.current = dockPosition;
  }, [dockPosition]);
  const panelDrag = useDockDrag(panelRef, dockPosition, setDockPosition);
  const feed = useQuery(api.communityYoutube.getFeed, {});
  const liveStatus = useQuery(api.communityLive.getLiveStatus, {});
  const refreshLive = useAction(api.communityLive.refreshLiveStatus);

  useEffect(() => {
    void refreshLive({});
  }, [refreshLive]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshLive({});
    }, 90_000);
    return () => window.clearInterval(id);
  }, [refreshLive]);

  const [queueOpen, setQueueOpen] = useState(false);
  const [panelScale, setPanelScale] = useState(DOCK_SCALE_MIN);
  const [viewportSize, setViewportSize] = useState(() =>
    typeof window !== "undefined"
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: DOCK_PANEL_BASE_WIDTH_CAP_PX + DOCK_PANEL_WIDTH_GUTTER_PX, h: DOCK_PANEL_MAX_HEIGHT_CAP_DEFAULT_PX }
  );

  const resizeSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startWidthPx: number;
    baseWidthPx: number;
    maxWidthPx: number;
  } | null>(null);

  useEffect(() => {
    if (panelState === "open") return;
    const id = window.requestAnimationFrame(() => setPanelScale(DOCK_SCALE_MIN));
    return () => window.cancelAnimationFrame(id);
  }, [panelState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewportSize({ w, h });
      const base = Math.min(DOCK_PANEL_BASE_WIDTH_CAP_PX, Math.max(1, w - DOCK_PANEL_WIDTH_GUTTER_PX));
      if (base > 0) {
        const maxW = Math.min(base * DOCK_SCALE_MAX, w - DOCK_MARGIN * 2);
        setPanelScale((s) => Math.min(s, maxW / base));
      }
      const p = dockPosRef.current;
      if (!p || panelState !== "open") return;
      const el = panelRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setDockPosition(clampDockToViewport(p.x, p.y, r.width, r.height));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [panelState, setDockPosition]);

  const { panelWidthPx, panelMaxHeightPx } = useMemo(() => {
    const { w, h } = viewportSize;
    const baseW = Math.min(DOCK_PANEL_BASE_WIDTH_CAP_PX, Math.max(1, w - DOCK_PANEL_WIDTH_GUTTER_PX));
    const maxW = Math.min(baseW * DOCK_SCALE_MAX, w - DOCK_MARGIN * 2);
    const widthPx = Math.round(Math.min(baseW * panelScale, maxW));
    const baseH = getDockBaseMaxHeightPxForSize(w, h);
    const maxH = Math.min(baseH * panelScale, h - DOCK_MARGIN * 2);
    return { panelWidthPx: widthPx, panelMaxHeightPx: maxH };
  }, [panelScale, viewportSize]);

  const onResizePointerDown = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const el = panelRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const baseWidthPx = getDockBaseWidthPx();
    const maxWidthPx = Math.min(baseWidthPx * DOCK_SCALE_MAX, window.innerWidth - DOCK_MARGIN * 2);
    resizeSessionRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startWidthPx: el.offsetWidth,
      baseWidthPx,
      maxWidthPx,
    };
  }, []);

  const onResizePointerMove = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = resizeSessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;
    const dx = e.clientX - s.startClientX;
    const w = Math.min(Math.max(s.startWidthPx + dx, s.baseWidthPx), s.maxWidthPx);
    setPanelScale(w / s.baseWidthPx);
  }, []);

  const onResizePointerEnd = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = resizeSessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;
    resizeSessionRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  const liveRows = useMemo(() => {
    const rows: Array<{
      key: string;
      playback: UniversusDockPlayback;
      subtitle: string;
      thumb?: string;
    }> = [];
    if (liveStatus?.youtubeLive) {
      rows.push({
        key: `yt-live-${liveStatus.youtubeLive.videoId}`,
        playback: {
          kind: "youtube-live",
          videoId: liveStatus.youtubeLive.videoId,
          title: liveStatus.youtubeLive.title,
        },
        subtitle: liveStatus.youtubeLive.channelTitle ?? "YouTube",
        thumb: liveStatus.youtubeLive.thumbnailUrl,
      });
    }
    if (liveStatus?.twitchLive) {
      rows.push({
        key: `tw-live-${liveStatus.twitchLive.login}`,
        playback: {
          kind: "twitch-live",
          channelLogin: liveStatus.twitchLive.login,
          title: liveStatus.twitchLive.title,
        },
        subtitle:
          liveStatus.twitchLive.viewerCount != null
            ? `${liveStatus.twitchLive.viewerCount.toLocaleString()} watching`
            : "Twitch",
        thumb: liveStatus.twitchLive.thumbnailUrl,
      });
    }
    return rows;
  }, [liveStatus]);

  const prevPanelStateRef = useRef(panelState);
  const shouldAutoplayOnOpenRef = useRef(false);

  useEffect(() => {
    const becameOpen = panelState === "open" && prevPanelStateRef.current !== "open";
    prevPanelStateRef.current = panelState;

    if (panelState !== "open") {
      shouldAutoplayOnOpenRef.current = false;
      return;
    }

    if (becameOpen) {
      setQueueOpen(false);
      shouldAutoplayOnOpenRef.current = true;
    }

    if (!shouldAutoplayOnOpenRef.current) return;
    if (feed === undefined || liveStatus === undefined) return;

    const first = getFirstQueuePlayback(liveRows, feed);
    if (first) {
      setPlayback(first);
    }
    shouldAutoplayOnOpenRef.current = false;
  }, [panelState, feed, liveRows, setPlayback]);

  useLayoutEffect(() => {
    if (!dockPosition || panelState !== "open") return;
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next = clampDockToViewport(dockPosition.x, dockPosition.y, r.width, r.height);
    if (next.x !== dockPosition.x || next.y !== dockPosition.y) {
      setDockPosition(next);
    }
  }, [panelState, queueOpen, dockPosition, setDockPosition, panelScale]);

  const dockedStyle =
    dockPosition != null
      ? { left: dockPosition.x, top: dockPosition.y, right: "auto" as const, bottom: "auto" as const }
      : {};

  const panelBoxStyle: CSSProperties = {
    ...dockedStyle,
    width: panelWidthPx,
    maxHeight: panelMaxHeightPx,
  };

  if (panelState !== "open") return null;
  if (!portalContainer) return null;

  return createPortal(
        <div
          ref={panelRef}
          className={cn(
            "fixed z-[500] flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/98 shadow-2xl backdrop-blur-xl",
            !dockPosition && "bottom-[5.5rem] right-3 md:bottom-6 md:right-4"
          )}
          style={panelBoxStyle}
          role="region"
          aria-label="UniVersus mini player"
        >
          <div
            className="flex shrink-0 cursor-grab touch-none items-center gap-2 border-b border-border/40 py-2 pl-3 pr-2 active:cursor-grabbing"
            {...panelDrag.dragHandleProps}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Tv className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Mini player
              </span>
              {liveRows.length > 0 ? (
                <Badge variant="destructive" className="h-5 px-1.5 text-[9px]">
                  Live
                </Badge>
              ) : null}
            </div>
            <div className="flex shrink-0 cursor-default items-center gap-0.5" data-dock-no-drag>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => minimize()}
                aria-label="Minimize"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => close()} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="shrink-0 border-b border-border/30">
            {playback === null ? (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-muted/40 px-4 text-center">
                <Radio className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Choose something from the queue</p>
              </div>
            ) : playback.kind === "twitch-live" ? (
              <TwitchStreamEmbed key={playback.channelLogin} channel={playback.channelLogin} title={playback.title} />
            ) : (
              <YoutubeEmbed
                key={playback.videoId}
                videoId={playback.videoId}
                title={playback.title}
                className="rounded-none"
              />
            )}
            {playback ? (
              <p className="line-clamp-2 px-3 py-2 text-xs font-medium leading-snug">{playback.title}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-stretch border-b border-border/30">
            <button
              type="button"
              onClick={() => setQueueOpen((v) => !v)}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
            >
              {queueOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Queue</span>
            </button>
            <button
              type="button"
              aria-label="Resize mini player"
              className="touch-none shrink-0 cursor-nwse-resize border-l border-border/30 px-2.5 py-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              data-dock-no-drag
              onPointerDown={onResizePointerDown}
              onPointerMove={onResizePointerMove}
              onPointerUp={onResizePointerEnd}
              onPointerCancel={onResizePointerEnd}
            >
              <ArrowDownRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {queueOpen ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="p-2 pb-4">
                {feed === undefined ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <>
                    {liveRows.length > 0 ? (
                      <div className="mb-3 space-y-1.5">
                        <p className="px-1 font-mono text-[9px] uppercase tracking-widest text-red-400/90">Live now</p>
                        {liveRows.map((row) => {
                          const active = playbackEquals(playback, row.playback);
                          return (
                            <button
                              key={row.key}
                              type="button"
                              onClick={() => setPlayback(row.playback)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg border border-border/40 px-2 py-2 text-left transition hover:border-primary/30 hover:bg-primary/[0.06]",
                                active && "border-primary/40 bg-primary/[0.08]"
                              )}
                            >
                              <div className="relative h-11 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted">
                                {row.thumb ? (
                                  <Image src={row.thumb} alt="" fill className="object-cover" sizes="72px" />
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-red-950/40">
                                    <Play className="h-4 w-4 text-red-400" />
                                  </div>
                                )}
                                <span className="absolute bottom-0.5 left-0.5 rounded bg-red-600 px-1 font-mono text-[8px] font-bold text-white">
                                  LIVE
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={cn(
                                    "line-clamp-2 text-[11px] font-medium leading-snug",
                                    active && "text-primary"
                                  )}
                                >
                                  {row.playback.title}
                                </p>
                                <p className="truncate text-[10px] text-muted-foreground">{row.subtitle}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {feed.feedKind !== "empty" && feed.items.length > 0 ? (
                      <>
                        {liveRows.length > 0 ? (
                          <p className="mb-1.5 px-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                            Curated
                          </p>
                        ) : null}
                        <ul className="space-y-1">
                          {feed.items.map((video) => {
                            const vodPlayback: UniversusDockPlayback = {
                              kind: "youtube-vod",
                              videoId: video.youtubeVideoId,
                              title: video.title ?? "Video",
                            };
                            const active = playbackEquals(playback, vodPlayback);
                            return (
                              <li key={video.youtubeVideoId}>
                                <button
                                  type="button"
                                  onClick={() => setPlayback(vodPlayback)}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-primary/[0.06]",
                                    active && "bg-primary/[0.08]"
                                  )}
                                >
                                  <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md">
                                    {video.thumbnailUrl ? (
                                      <Image
                                        src={video.thumbnailUrl}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                      />
                                    ) : (
                                      <div className="h-full w-full bg-muted" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={cn(
                                        "line-clamp-2 text-[11px] font-medium leading-snug",
                                        active && "text-primary"
                                      )}
                                    >
                                      {video.title ?? "Video"}
                                    </p>
                                    <p className="truncate text-[10px] text-muted-foreground">{video.channelTitle}</p>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">No curated videos yet.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>,
    portalContainer
  );
}
