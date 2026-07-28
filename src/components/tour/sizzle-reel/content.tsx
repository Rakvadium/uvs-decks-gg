"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import * as m from "framer-motion/m";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBrandWordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";
import { useSizzleReel } from "./hook";
import { SizzleStages } from "./stages";

function ProgressSegments({
  count,
  index,
  progress,
  onSelect,
}: {
  count: number;
  index: number;
  progress: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex w-full gap-1.5" role="tablist" aria-label="Tour segments">
      {Array.from({ length: count }).map((_, i) => {
        const fill = i < index ? 1 : i === index ? progress : 0;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Go to segment ${i + 1}`}
            onClick={() => onSelect(i)}
            className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-100 ease-linear group-hover:bg-primary/90"
              style={{ width: `${fill * 100}%` }}
            />
          </button>
        );
      })}
    </div>
  );
}

export function SizzleReelContent() {
  const {
    beats,
    beat,
    index,
    playing,
    progress,
    prefersReducedMotion,
    goTo,
    next,
    prev,
    togglePlay,
  } = useSizzleReel();

  const animate = !prefersReducedMotion;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,color-mix(in_oklch,var(--secondary)_14%,transparent),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-4 md:px-8">
        <Link href="/home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <AppBrandWordmark layout="inline" size="sm" className="text-foreground [&_span]:text-inherit" />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/home">Skip</Link>
          </Button>
          <Button variant="outline" size="icon-sm" asChild aria-label="Close tour">
            <Link href="/home">
              <X className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col justify-between gap-6 px-4 pb-6 md:px-8 md:pb-8">
        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-rows-[auto_minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:grid-rows-1 md:items-center md:gap-10">
          <div className="space-y-5 md:space-y-7">
            <ProgressSegments count={beats.length} index={index} progress={progress} onSelect={goTo} />

            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={beat.id}
                initial={animate ? { opacity: 0, y: 18 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={animate ? { opacity: 0, y: -12 } : undefined}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{beat.kicker}</p>
                <h1 className="max-w-xl font-display text-4xl font-bold tracking-tight text-pretty md:text-5xl lg:text-6xl">
                  {beat.title}
                </h1>
                <p className="max-w-lg font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  {beat.line}
                </p>
                {beat.ctaHref && beat.ctaLabel ? (
                  <div className="pt-1">
                    <Button asChild>
                      <Link href={beat.ctaHref}>{beat.ctaLabel}</Link>
                    </Button>
                  </div>
                ) : null}
              </m.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button variant="outline" size="icon-sm" onClick={prev} aria-label="Previous segment">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon-sm" onClick={togglePlay} aria-label={playing ? "Pause tour" : "Play tour"}>
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon-sm" onClick={next} aria-label="Next segment">
                <SkipForward className="h-4 w-4" />
              </Button>
              <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")} / {String(beats.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "relative min-h-[300px] overflow-hidden rounded-3xl border border-border/50 bg-card/30 shadow-[var(--chrome-elevation-mid)] backdrop-blur-sm md:min-h-[480px]",
              "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/40 before:to-transparent"
            )}
          >
            <SizzleStages activeId={beat.id} animate={animate} />
          </div>
        </div>

        <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border/30 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Space play/pause · Arrows seek
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/community">Community</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/gallery">Enter Gallery</Link>
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export function SizzleReel(): ReactNode {
  return <SizzleReelContent />;
}
