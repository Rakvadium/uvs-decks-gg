"use client";

/**
 * V1 - "Neon HUD"
 * A heads-up display inspired layout with glowing neon stat bars instead of square blocks.
 * Stats are displayed as horizontal bars with the value inline.
 * Two-column layout: image left, info right with a sleek data readout feel.
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SymbolIcon } from "../../symbol-icon";
import { AbilityText } from "../ability-text";
import { CardDetailsContentProvider, useCardDetailsContent } from "../content-context";
import { DeckSectionControls } from "../deck-section-controls";
import { KeywordBadge } from "../keyword-badge";
import { StartingCharacterButton } from "../starting-character-button";
import type { CardDetailsVariantProps } from "./types";

/* ── Stat bar (replaces square blocks) ─────────────────────────── */

function NeonStatBar({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  color: string;
}) {
  if (value === undefined || value === null) return null;

  return (
    <div className="group flex items-center gap-3 py-1">
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <span className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="relative flex-1 h-5 rounded-sm overflow-hidden bg-muted/20">
        <div
          className="absolute inset-y-0 left-0 rounded-sm transition-all"
          style={{
            width: `${Math.min(100, (Number(value) / 10) * 100)}%`,
            background: `linear-gradient(90deg, ${color}40, ${color}15)`,
            borderRight: `2px solid ${color}`,
          }}
        />
        <span
          className="absolute inset-0 flex items-center px-2 text-xs font-mono font-bold"
          style={{ color }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function ZoneBarDisplay({ zone, label, color }: { zone?: string; label: string; color: string }) {
  if (!zone) return null;

  return (
    <div className="group flex items-center gap-3 py-1">
      <Target className="h-4 w-4 shrink-0" style={{ color }} />
      <span className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {zone.split(/[\s\/,]+/).filter(Boolean).map((z, i) => (
          <span
            key={i}
            className="rounded-sm border px-2 py-0.5 text-xs font-mono font-semibold uppercase"
            style={{
              borderColor: `${color}50`,
              background: `${color}15`,
              color,
            }}
          >
            {z}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Content body ──────────────────────────────────────────────── */

function V1Content() {
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
    <div className="flex-1 space-y-4 overflow-y-auto p-5">
      {/* Title */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-display font-bold uppercase tracking-wide leading-tight">
            {card.name}
          </h2>
          {card.collectorNumber && (
            <span className="shrink-0 text-[10px] font-mono text-muted-foreground/50">
              #{card.collectorNumber}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {card.type && <Badge variant="cyber">{card.type}</Badge>}
          {showRarity && <Badge variant="outline">{card.rarity}</Badge>}
          {card.setName && (
            <Badge variant="secondary" className="text-[10px]">
              {card.setName}
            </Badge>
          )}
          {symbols.length > 0 && (
            <>
              <div className="mx-1 h-3 w-px bg-border/30" />
              <div className="flex items-center gap-1">
                {symbols.map((symbol) => (
                  <SymbolIcon key={symbol} symbol={symbol} size="md" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* General stats as neon bars */}
      {hasGeneralStats && (
        <div className="rounded-md border border-border/20 bg-background/30 p-3">
          <NeonStatBar icon={Gauge} label="Diff" value={card.difficulty} color="#f97316" />
          <NeonStatBar icon={Shield} label="Check" value={card.control} color="var(--primary)" />
          <ZoneBarDisplay zone={card.blockZone} label="Block" color="#ef4444" />
          <NeonStatBar icon={Target} label="Blk Mod" value={card.blockModifier} color="#a855f7" />
          <NeonStatBar icon={Heart} label="Health" value={card.health} color="#ef4444" />
          <NeonStatBar icon={Gauge} label="Vitality" value={card.stamina} color="#8b5cf6" />
          <NeonStatBar icon={Copy} label="Hand" value={card.handSize} color="var(--primary)" />
        </div>
      )}

      {/* Attack stats */}
      {hasAttackStats && (
        <div className="rounded-md border border-accent/20 bg-accent/5 p-3">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-accent/70">
            Attack
          </span>
          <NeonStatBar icon={Zap} label="Speed" value={card.speed} color="var(--accent)" />
          <ZoneBarDisplay zone={card.attackZone} label="Zone" color="var(--accent)" />
          <NeonStatBar icon={Swords} label="Damage" value={card.damage} color="var(--accent)" />
        </div>
      )}

      {/* Keywords */}
      {(keywordAbilities.length > 0 || otherKeywords.length > 0) && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Keywords
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {keywordAbilities.map((kw, i) => (
              <KeywordBadge key={`a-${i}`} keyword={kw} />
            ))}
            {keywordAbilities.length > 0 && otherKeywords.length > 0 && (
              <span className="mx-1 font-mono text-muted-foreground/30">/</span>
            )}
            {otherKeywords.map((kw, i) => (
              <KeywordBadge key={`o-${i}`} keyword={kw} />
            ))}
          </div>
        </div>
      )}

      {/* Card text */}
      {card.text && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Card Text
          </span>
          <div className="rounded-md border border-border/30 bg-card/30 p-3 backdrop-blur-sm">
            <AbilityText text={card.text} />
          </div>
        </div>
      )}

      {/* Copy limit */}
      {card.copyLimit && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Copy className="h-3.5 w-3.5" />
          <span className="font-mono">
            Limit: <span className="font-bold text-foreground">{card.copyLimit}</span> in Main/Side
          </span>
        </div>
      )}

      {/* Starting character */}
      <StartingCharacterButton card={card} compact />

      {/* Deck controls */}
      <DeckSectionControls card={card} />

      {/* Meta */}
      <Separator className="bg-border/20" />
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/50">
        <span className="uppercase tracking-widest">
          {card.setCode} &bull; {card.rarity}
        </span>
        {card.oracleId && <span>Oracle: {card.oracleId.slice(0, 8)}...</span>}
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────── */

export function CardDetailsV1({
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
        {/* Image panel */}
        <div className="relative flex shrink-0 items-center justify-center bg-gradient-to-br from-background via-card to-background p-6 lg:sticky lg:top-0 lg:w-[300px] lg:self-start">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="relative z-10 w-full max-w-[230px]">
            <motion.div className="relative aspect-[2.5/3.5] w-full" style={{ perspective: 1000 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isFlipped ? "back" : "front"}
                  initial={prefersReducedMotion ? {} : { rotateY: -90, opacity: 0 }}
                  animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
                  exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 overflow-hidden rounded-xl shadow-[0_0_22px_-12px_var(--primary)]"
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
                      <div className="text-center">
                        <Hexagon className="mx-auto mb-2 h-12 w-12 text-primary/30" />
                        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          No Image
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="absolute -inset-2 -z-10 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-xl opacity-50" />
            </motion.div>

            {hasBack && (
              <div className="mt-3 flex justify-center">
                <Button variant="outline" size="sm" onClick={onToggleFlip} className="gap-2">
                  <RotateCcw
                    className={cn(
                      "h-4 w-4",
                      !prefersReducedMotion && "transition-transform duration-300",
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

        {/* Content */}
        <V1Content />
      </div>
    </CardDetailsContentProvider>
  );
}
