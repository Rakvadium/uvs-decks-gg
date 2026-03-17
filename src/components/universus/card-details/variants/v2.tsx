"use client";

/**
 * V2 - "Holographic"
 * A card-centric layout with the image prominently displayed on top,
 * stats as floating holographic chips/pills around it.
 * Full-width approach with stats displayed as a flowing grid of
 * rounded pill-shaped indicators with subtle glow effects.
 */

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  Gauge,
  Heart,
  Hexagon,
  RotateCcw,
  Shield,
  Swords,
  Target,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SymbolIcon } from "../../symbol-icon";
import { AbilityText } from "../ability-text";
import { CardDetailsContentProvider, useCardDetailsContent } from "../content-context";
import { KeywordBadge } from "../keyword-badge";
import { StartingCharacterButton } from "../starting-character-button";
import type { CardDetailsVariantProps } from "./types";

/* ── Holographic stat chip ─────────────────────────────────────── */

function HoloChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number | undefined;
  color: string;
}) {
  if (value === undefined || value === null) return null;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-all hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${color}18, ${color}08)`,
        border: `1px solid ${color}35`,
        boxShadow: `0 0 12px -4px ${color}30, inset 0 1px 0 ${color}15`,
      }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-display font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function HoloZone({ zone, label, color }: { zone?: string; label: string; color: string }) {
  if (!zone) return null;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
      style={{
        background: `linear-gradient(135deg, ${color}18, ${color}08)`,
        border: `1px solid ${color}35`,
        boxShadow: `0 0 12px -4px ${color}30`,
      }}
    >
      <Target className="h-3.5 w-3.5" style={{ color }} />
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-display font-bold" style={{ color }}>
        {zone}
      </span>
    </div>
  );
}

/* ── Content ───────────────────────────────────────────────────── */

function V2Content() {
  const { card, symbols, showRarity, keywordAbilities, otherKeywords } = useCardDetailsContent();

  const hasGeneralStats =
    card.control !== undefined ||
    card.difficulty !== undefined ||
    card.blockZone ||
    card.blockModifier !== undefined ||
    card.health !== undefined ||
    card.stamina !== undefined ||
    card.handSize !== undefined;

  const hasAttackStats = card.speed !== undefined || card.attackZone || card.damage !== undefined;

  return (
    <div className="space-y-4 p-5">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide">
            {card.name}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {card.type && <Badge variant="cyber">{card.type}</Badge>}
            {showRarity && <Badge variant="outline">{card.rarity}</Badge>}
            {card.setName && <Badge variant="secondary" className="text-[10px]">{card.setName}</Badge>}
            {symbols.length > 0 && (
              <>
                <div className="mx-1 h-3 w-px bg-border/30" />
                <div className="flex items-center gap-1">
                  {symbols.map((s) => (
                    <SymbolIcon key={s} symbol={s} size="md" />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {card.collectorNumber && (
          <span className="text-[10px] font-mono text-muted-foreground/40">#{card.collectorNumber}</span>
        )}
      </div>

      {/* Holographic stat chips - flowing layout */}
      {(hasGeneralStats || hasAttackStats) && (
        <div className="flex flex-wrap gap-2">
          <HoloChip icon={Gauge} label="Diff" value={card.difficulty} color="#f97316" />
          <HoloChip icon={Shield} label="Check" value={card.control} color="#3b82f6" />
          <HoloZone zone={card.blockZone} label="Block" color="#ef4444" />
          <HoloChip icon={Target} label="Blk Mod" value={card.blockModifier} color="#a855f7" />
          <HoloChip icon={Heart} label="HP" value={card.health} color="#ef4444" />
          <HoloChip icon={Gauge} label="Vitality" value={card.stamina} color="#8b5cf6" />
          <HoloChip icon={Copy} label="Hand" value={card.handSize} color="#3b82f6" />

          {hasAttackStats && (
            <>
              <div className="w-px self-stretch bg-accent/20" />
              <HoloChip icon={Zap} label="Speed" value={card.speed} color="var(--accent)" />
              <HoloZone zone={card.attackZone} label="Zone" color="var(--accent)" />
              <HoloChip icon={Swords} label="Dmg" value={card.damage} color="var(--accent)" />
            </>
          )}
        </div>
      )}

      {/* Keywords */}
      {(keywordAbilities.length > 0 || otherKeywords.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {keywordAbilities.map((kw, i) => <KeywordBadge key={`a-${i}`} keyword={kw} />)}
          {keywordAbilities.length > 0 && otherKeywords.length > 0 && (
            <span className="mx-1 font-mono text-muted-foreground/30">/</span>
          )}
          {otherKeywords.map((kw, i) => <KeywordBadge key={`o-${i}`} keyword={kw} />)}
        </div>
      )}

      {/* Card text */}
      {card.text && (
        <div className="rounded-lg border border-border/30 bg-card/30 p-4 backdrop-blur-sm">
          <AbilityText text={card.text} />
        </div>
      )}

      {/* Copy limit + Starting Character */}
      <div className="flex flex-wrap items-center gap-3">
        {card.copyLimit && (
          <span className="text-xs font-mono text-muted-foreground">
            <Copy className="mr-1.5 inline h-3.5 w-3.5" />
            Limit {card.copyLimit} in Main/Side
          </span>
        )}
        <StartingCharacterButton card={card} compact />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-muted-foreground/40">
        <span className="uppercase tracking-widest">{card.setCode} &bull; {card.rarity}</span>
        {card.oracleId && <span>Oracle: {card.oracleId.slice(0, 8)}...</span>}
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────── */

export function CardDetailsV2({
  card,
  displayCard,
  backCard,
  hasBack,
  isFlipped,
  onToggleFlip,
}: CardDetailsVariantProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <CardDetailsContentProvider card={displayCard}>
      <div className="flex flex-col lg:flex-row">
        {/* Image - centered, large emphasis */}
        <div className="relative flex shrink-0 flex-col items-center justify-center bg-gradient-to-b from-background via-card/50 to-background p-6 lg:sticky lg:top-0 lg:w-[320px] lg:self-start">
          {/* Holographic shimmer background */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, #ff000015, #00ff0015, #0000ff15, #ff00ff15, #ff000015)",
            }}
          />

          <div className="relative z-10 w-full max-w-[250px]">
            <motion.div className="relative aspect-[2.5/3.5] w-full" style={{ perspective: 1000 }}>
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={isFlipped ? "back" : "front"}
                  initial={false}
                  animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
                  exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 overflow-hidden rounded-xl"
                  style={{
                    boxShadow:
                      "0 0 0 1px color-mix(in oklch, var(--primary) 35%, transparent), 0 0 5px color-mix(in oklch, var(--primary) 80%, transparent), 0 0 0 1px color-mix(in oklch, var(--secondary) 25%, transparent), 0 0 10px color-mix(in oklch, var(--secondary) 50%, transparent)",
                  }}
                >
                  {displayCard.imageUrl ? (
                    <Image
                      src={displayCard.imageUrl}
                      alt={displayCard.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center border border-border/50 bg-muted/50">
                      <Hexagon className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {hasBack && (
              <div className="mt-3 flex justify-center">
                <Button variant="outline" size="sm" onClick={onToggleFlip} className="gap-2 rounded-full">
                  <RotateCcw
                    className={cn(
                      "h-4 w-4",
                      !prefersReducedMotion && "transition-transform duration-150",
                      isFlipped && "rotate-180"
                    )}
                  />
                  <span className="text-xs font-mono uppercase tracking-wider">
                    {isFlipped ? "Front" : "Back"}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content - scrollable right panel */}
        <div className="flex-1 overflow-y-auto">
          <V2Content />
        </div>
      </div>
    </CardDetailsContentProvider>
  );
}
