"use client";

import type { ReactNode } from "react";
import * as m from "framer-motion/m";
import { cn } from "@/lib/utils";
import type { SizzleStageId } from "./types";

type StageProps = {
  active: boolean;
  animate: boolean;
};

function StageShell({
  active,
  animate,
  className,
  children,
}: StageProps & { className?: string; children: ReactNode }) {
  return (
    <m.div
      initial={false}
      animate={
        active
          ? { opacity: 1, scale: 1, y: 0 }
          : { opacity: 0, scale: animate ? 0.96 : 1, y: animate ? 18 : 0 }
      }
      transition={{ duration: animate ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center p-4 md:p-8",
        !active && "invisible",
        className
      )}
      aria-hidden={!active}
    >
      {children}
    </m.div>
  );
}

function CardTile({ className }: { className?: string; delay?: number; animate?: boolean }) {
  return (
    <div
      className={cn(
        "aspect-[5/7] rounded-lg border border-border/50 bg-card shadow-[var(--chrome-elevation-low)]",
        className
      )}
    >
      <div className="h-1/3 rounded-t-[inherit] bg-gradient-to-br from-primary/35 via-primary/15 to-muted/30" />
      <div className="space-y-1.5 p-2">
        <div className="h-1.5 w-3/4 rounded-full bg-foreground/25" />
        <div className="h-1 w-1/2 rounded-full bg-foreground/15" />
      </div>
    </div>
  );
}

function OpenStage({ active, animate }: StageProps) {
  return (
    <StageShell active={active} animate={animate}>
      <div className="relative w-full max-w-4xl">
        <div className="absolute -left-8 top-8 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-4 bottom-0 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative grid grid-cols-3 gap-3 md:gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <CardTile
              key={i}
              animate={animate && active}
              delay={0.08 * i}
              className={cn(i === 1 || i === 4 ? "translate-y-4 md:translate-y-8" : "", i % 2 === 0 ? "opacity-90" : "opacity-100")}
            />
          ))}
        </div>
      </div>
    </StageShell>
  );
}

function GalleryStage({ active, animate }: StageProps) {
  return (
    <StageShell active={active} animate={animate}>
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border/50 bg-background/80 shadow-[var(--chrome-elevation-mid)] backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
          <div className="h-8 flex-1 rounded-full border border-[color:var(--control-dual-border)] bg-muted/30" />
          <div className="hidden h-8 w-24 rounded-md border border-border/50 bg-card/80 sm:block" />
          <div className="h-8 w-8 rounded-md border border-border/50 bg-card/80" />
        </div>
        <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-5 md:gap-4 md:p-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <CardTile key={i} animate={animate && active} delay={0.04 * i} />
          ))}
        </div>
      </div>
    </StageShell>
  );
}

function DecksStage({ active, animate }: StageProps) {
  return (
    <StageShell active={active} animate={animate}>
      <div className="grid w-full max-w-5xl gap-3 md:grid-cols-[1.1fr_0.9fr] md:gap-4">
        <div className="overflow-hidden rounded-3xl border border-border/50 bg-card/80 p-4 shadow-[var(--chrome-elevation-mid)] backdrop-blur-md md:p-6">
          <p className="chrome-label-case mb-3 text-[10px] text-muted-foreground">Main</p>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <CardTile key={i} animate={animate && active} delay={0.03 * i} className="opacity-95" />
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          {["Side", "Reference"].map((label, lane) => (
            <div
              key={label}
              className="rounded-2xl border border-border/50 bg-background/80 p-4 shadow-[var(--chrome-elevation-low)] backdrop-blur-md"
            >
              <p className="chrome-label-case mb-3 text-[10px] text-muted-foreground">{label}</p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardTile key={i} animate={animate && active} delay={0.12 + lane * 0.1 + i * 0.04} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StageShell>
  );
}

function CollectionStage({ active, animate }: StageProps) {
  return (
    <StageShell active={active} animate={animate}>
      <div className="w-full max-w-3xl space-y-3 rounded-3xl border border-border/50 bg-card/80 p-4 shadow-[var(--chrome-elevation-mid)] backdrop-blur-md md:p-6">
        {["Character", "Attack", "Foundation"].map((row, i) => (
          <m.div
            key={row}
            initial={animate && active ? { opacity: 0, x: -16 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * i }}
            className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/60 p-3"
          >
            <div className="h-12 w-9 shrink-0 rounded-md border border-border/50 bg-gradient-to-br from-primary/30 to-muted/40" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="chrome-label-case truncate text-sm font-semibold">{row}</p>
                <span className="text-xs tabular-nums text-primary">×{4 + i * 3}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                <m.div
                  initial={animate && active ? { width: "0%" } : false}
                  animate={{ width: `${48 + i * 18}%` }}
                  transition={{ duration: 0.8, delay: 0.15 * i }}
                  className="h-full rounded-full bg-primary/70"
                />
              </div>
            </div>
          </m.div>
        ))}
      </div>
    </StageShell>
  );
}

function CommunityStage({ active, animate }: StageProps) {
  const lanes = [
    { label: "S", tone: "from-primary/40" },
    { label: "A", tone: "from-secondary/40" },
    { label: "B", tone: "from-accent/30" },
  ];

  return (
    <StageShell active={active} animate={animate}>
      <div className="w-full max-w-4xl space-y-3 rounded-3xl border border-border/50 bg-background/80 p-4 shadow-[var(--chrome-elevation-mid)] backdrop-blur-md md:p-6">
        {lanes.map((lane, i) => (
          <m.div
            key={lane.label}
            initial={animate && active ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
            className="flex items-center gap-3"
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-br to-transparent text-lg font-bold",
                lane.tone
              )}
            >
              {lane.label}
            </div>
            <div className="flex min-w-0 flex-1 gap-2 overflow-hidden rounded-xl border border-border/40 bg-card/60 p-2">
              {Array.from({ length: 5 - i }).map((_, card) => (
                <div
                  key={card}
                  className="aspect-[5/7] w-12 shrink-0 rounded-md border border-border/50 bg-card md:w-14"
                />
              ))}
            </div>
          </m.div>
        ))}
      </div>
    </StageShell>
  );
}

function TeamsStage({ active, animate }: StageProps) {
  return (
    <StageShell active={active} animate={animate}>
      <div className="grid w-full max-w-4xl gap-3 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-border/50 bg-card/80 p-5 shadow-[var(--chrome-elevation-mid)] backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-lg font-bold text-primary">
              T
            </div>
            <div>
              <p className="chrome-label-case text-base font-semibold">Team Hub</p>
              <p className="chrome-label-case text-[10px] text-muted-foreground">4 members</p>
            </div>
          </div>
          <div className="space-y-2">
            {["Announcements", "Shared Decks", "Calendar"].map((item, i) => (
              <m.div
                key={item}
                initial={animate && active ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.08 * i }}
                className="chrome-label-case rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-xs text-muted-foreground"
              >
                {item}
              </m.div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-border/50 bg-background/80 p-5 shadow-[var(--chrome-elevation-low)] backdrop-blur-md">
          <p className="chrome-label-case mb-3 text-[10px] text-muted-foreground">Shared Decks</p>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <m.div
                key={i}
                initial={animate && active ? { opacity: 0, scale: 0.95 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="rounded-xl border border-border/50 bg-card/70 p-3"
              >
                <div className="mb-3 aspect-video rounded-lg bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
                <div className="h-1.5 w-2/3 rounded-full bg-foreground/20" />
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </StageShell>
  );
}

function CloseStage({ active, animate }: StageProps) {
  return (
    <StageShell active={active} animate={animate}>
      <div className="relative flex w-full max-w-3xl flex-col items-center">
        <div className="absolute inset-x-10 top-1/2 h-40 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative grid w-full grid-cols-3 gap-3 md:gap-5">
          {[0, 1, 2].map((i) => (
            <CardTile
              key={i}
              animate={animate && active}
              delay={0.1 * i}
              className={cn(i === 1 ? "scale-110 shadow-[var(--chrome-elevation-mid)]" : "opacity-80")}
            />
          ))}
        </div>
      </div>
    </StageShell>
  );
}

const STAGE_MAP: Record<SizzleStageId, (props: StageProps) => ReactNode> = {
  open: OpenStage,
  gallery: GalleryStage,
  decks: DecksStage,
  collection: CollectionStage,
  community: CommunityStage,
  teams: TeamsStage,
  close: CloseStage,
};

export function SizzleStages({
  activeId,
  animate,
}: {
  activeId: SizzleStageId;
  animate: boolean;
}) {
  return (
    <div className="relative h-full min-h-[280px] w-full md:min-h-[420px]">
      {(Object.keys(STAGE_MAP) as SizzleStageId[]).map((id) => {
        const Stage = STAGE_MAP[id];
        return <Stage key={id} active={id === activeId} animate={animate} />;
      })}
    </div>
  );
}
