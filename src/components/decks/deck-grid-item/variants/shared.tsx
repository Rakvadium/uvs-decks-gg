"use client";

import type { ReactNode } from "react";
import { Eye, Globe, Link2, Lock, Pencil, Trophy, UserPlus, type LucideIcon } from "lucide-react";
import { deckTeamSharingFromDeck, deckVisibilityDisplayLabel, type DeckVisibility } from "@/lib/deck/visibility";
import { cn } from "@/lib/utils";
import type { DeckListItem } from "../types";

const VISIBILITY_ICONS: Record<DeckVisibility, LucideIcon> = {
  private: Lock,
  unlisted: Link2,
  share: UserPlus,
  team: Eye,
  tournament: Trophy,
  public: Globe,
};

function isPublicVisibility(visibility: DeckVisibility) {
  return visibility === "public" || visibility === "tournament";
}

function VisibilityIcon({
  deck,
  visibility,
  className,
}: {
  deck: DeckListItem;
  visibility: DeckVisibility;
  className?: string;
}) {
  if (visibility === "team" && deckTeamSharingFromDeck(deck) === "team_editable") {
    return <Pencil className={className} />;
  }
  const Icon = VISIBILITY_ICONS[visibility];
  return <Icon className={className} />;
}

export function VisibilityGlyph({
  deck,
  visibility,
  className,
  iconClassName,
}: {
  deck: DeckListItem;
  visibility: DeckVisibility;
  className?: string;
  iconClassName?: string;
}) {
  const emphasized = isPublicVisibility(visibility);

  return (
    <span
      title={deckVisibilityDisplayLabel(deck)}
      className={cn(
        "inline-flex items-center justify-center rounded-md border bg-card/80 backdrop-blur-sm",
        emphasized ? "border-primary/40 text-primary" : "border-border/50 text-muted-foreground",
        className
      )}
    >
      <VisibilityIcon deck={deck} visibility={visibility} className={cn("h-3 w-3", iconClassName)} />
    </span>
  );
}

export function ProgressRing({
  progress,
  size = 36,
  stroke = 3,
  className,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const complete = clamped >= 1;

  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn("transition-[stroke-dashoffset] duration-200", complete ? "stroke-success" : "stroke-warning")}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}
