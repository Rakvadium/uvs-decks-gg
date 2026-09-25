"use client";

import { Fragment, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  HeartPulse,
  Megaphone,
  Play,
  RotateCw,
  Shield,
  Skull,
  Swords,
  UserRound,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Known `{Token}` rules markers (official card text) → icon + accent. */
const RULES_TOKENS: Record<string, { icon: LucideIcon; color: string }> = {
  play: { icon: Play, color: "#22D3EE" },
  spend: { icon: RotateCw, color: "#F5C518" },
  blocker: { icon: Shield, color: "#60A5FA" },
  "go solo": { icon: UserRound, color: "#F43F5E" },
  attack: { icon: Swords, color: "#F97316" },
  quick: { icon: Zap, color: "#FACC15" },
  call: { icon: Megaphone, color: "#A855F7" },
  defeated: { icon: Skull, color: "#94A3B8" },
  adrenaline: { icon: HeartPulse, color: "#FB7185" },
};

const FALLBACK_TOKEN_COLOR = "#94A3B8";

export function RulesTokenBadge({ token, compact = false }: { token: string; compact?: boolean }) {
  const known = RULES_TOKENS[token.trim().toLowerCase()];
  const Icon = known?.icon;
  const color = known?.color ?? FALLBACK_TOKEN_COLOR;

  return (
    <span
      className={cn(
        "chrome-label-case mx-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-sm border align-[0.08em] font-bold leading-none",
        compact ? "px-[0.35em] py-[0.2em] text-[0.8em]" : "px-1.5 py-0.5 text-[0.72rem]"
      )}
      style={{ backgroundColor: `${color}26`, borderColor: `${color}80`, color }}
    >
      {Icon ? <Icon aria-hidden className={compact ? "size-[1em]" : "size-3"} strokeWidth={2.5} /> : null}
      {token.trim()}
    </span>
  );
}

const TOKEN_OR_REMINDER = /(\{[^}]+\}|\([^)]*\))/g;

function renderLine(line: string, compact: boolean): ReactNode[] {
  return line
    .split(TOKEN_OR_REMINDER)
    .filter((part) => part !== "")
    .map((part, index) => {
      if (part.startsWith("{") && part.endsWith("}")) {
        return <RulesTokenBadge key={index} token={part.slice(1, -1)} compact={compact} />;
      }
      if (part.startsWith("(") && part.endsWith(")")) {
        return (
          <span key={index} className="italic text-muted-foreground">
            {part}
          </span>
        );
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
}

/**
 * Card rules text: one paragraph per line, `{Play}`-style markers as small badges, parenthesized
 * reminder text muted.
 */
export function CyberpunkRulesText({
  text,
  compact = false,
  className,
}: {
  text: string;
  /** Scales with the surrounding font size (card text frame). */
  compact?: boolean;
  className?: string;
}) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

  return (
    <div className={cn(compact ? "space-y-[0.4em]" : "space-y-2 text-sm leading-relaxed text-foreground/90", className)}>
      {lines.map((line, index) => (
        <p key={index} className="m-0">
          {renderLine(line, compact)}
        </p>
      ))}
    </div>
  );
}
