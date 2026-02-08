"use client";

/**
 * V4 - "Minimalist"
 * Clean, spacious layout with thin line accents and subtle gradients.
 * Stats shown as elegant inline pairs with colored dots instead of icons.
 * Card image large on left, clean typography on right.
 * Deck controls collapse into a single compact row.
 */

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Hexagon, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SymbolIcon } from "../../symbol-icon";
import { AbilityText } from "../ability-text";
import { CardDetailsContentProvider, useCardDetailsContent } from "../content-context";
import { DeckSectionControls } from "../deck-section-controls";
import { KeywordBadge } from "../keyword-badge";
import { StartingCharacterButton } from "../starting-character-button";
import type { CardDetailsVariantProps } from "./types";

/* ── Dot stat ──────────────────────────────────────────────────── */

function DotStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number | undefined;
  color: string;
}) {
  if (value === undefined || value === null) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/* ── Content ───────────────────────────────────────────────────── */

function V4Content() {
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
    <div className="flex-1 space-y-5 overflow-y-auto p-6">
      {/* Title - clean and large */}
      <div>
        <h2 className="text-2xl font-display font-bold uppercase tracking-wider">
          {card.name}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {card.type && <span>{card.type}</span>}
          {showRarity && (
            <>
              <span className="text-border">·</span>
              <span>{card.rarity}</span>
            </>
          )}
          {card.setName && (
            <>
              <span className="text-border">·</span>
              <span className="text-muted-foreground/60">{card.setName}</span>
            </>
          )}
          {card.collectorNumber && (
            <>
              <span className="text-border">·</span>
              <span className="text-muted-foreground/40">#{card.collectorNumber}</span>
            </>
          )}
        </div>
        {symbols.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {symbols.map((s) => (
              <SymbolIcon key={s} symbol={s} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Stats - compact flowing layout with dot indicators */}
      {(hasGeneralStats || hasAttackStats) && (
        <div className="space-y-3">
          {hasGeneralStats && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <DotStat label="Difficulty" value={card.difficulty} color="#f97316" />
              <DotStat label="Check" value={card.control} color="#3b82f6" />
              <DotStat label="Block Zone" value={card.blockZone?.toUpperCase()} color="#ef4444" />
              <DotStat label="Block Mod" value={card.blockModifier} color="#a855f7" />
              <DotStat label="Health" value={card.health} color="#ef4444" />
              <DotStat label="Vitality" value={card.stamina} color="#8b5cf6" />
              <DotStat label="Hand Size" value={card.handSize} color="#3b82f6" />
            </div>
          )}

          {hasAttackStats && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-l-2 border-accent/30 pl-3">
              <DotStat label="Speed" value={card.speed} color="var(--accent)" />
              <DotStat label="Attack Zone" value={card.attackZone?.toUpperCase()} color="var(--accent)" />
              <DotStat label="Damage" value={card.damage} color="var(--accent)" />
            </div>
          )}
        </div>
      )}

      {/* Thin separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* Keywords */}
      {(keywordAbilities.length > 0 || otherKeywords.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {keywordAbilities.map((kw, i) => <KeywordBadge key={`a-${i}`} keyword={kw} />)}
          {keywordAbilities.length > 0 && otherKeywords.length > 0 && (
            <span className="mx-1 font-mono text-muted-foreground/20">·</span>
          )}
          {otherKeywords.map((kw, i) => <KeywordBadge key={`o-${i}`} keyword={kw} />)}
        </div>
      )}

      {/* Card text */}
      {card.text && (
        <div className="rounded-lg bg-muted/20 p-4">
          <AbilityText text={card.text} />
        </div>
      )}

      {/* Copy limit + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {card.copyLimit && (
          <span className="text-xs text-muted-foreground/60">
            <Copy className="mr-1 inline h-3 w-3" />
            Limit {card.copyLimit}
          </span>
        )}
        <StartingCharacterButton card={card} compact />
      </div>

      {/* Deck controls */}
      <DeckSectionControls card={card} />

      {/* Meta - very subtle */}
      <div className="text-[10px] text-muted-foreground/30">
        {card.setCode} · {card.rarity}
        {card.oracleId && <span className="ml-3">Oracle: {card.oracleId.slice(0, 8)}...</span>}
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────── */

export function CardDetailsV4({
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
        {/* Image panel - clean with subtle border glow */}
        <div className="relative flex shrink-0 items-center justify-center p-8 lg:sticky lg:top-0 lg:w-[320px] lg:self-start">
          <div className="absolute bottom-0 left-0 top-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent lg:right-0 lg:left-auto" />

          <div className="relative z-10 w-full max-w-[240px]">
            <motion.div className="relative aspect-[2.5/3.5] w-full" style={{ perspective: 1000 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isFlipped ? "back" : "front"}
                  initial={prefersReducedMotion ? {} : { rotateY: -90, opacity: 0 }}
                  animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
                  exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 overflow-hidden rounded-lg shadow-xl"
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
                    <div className="flex h-full w-full items-center justify-center bg-muted/30">
                      <Hexagon className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {hasBack && (
              <div className="mt-4 flex justify-center">
                <Button variant="ghost" size="sm" onClick={onToggleFlip} className="gap-2 text-muted-foreground hover:text-foreground">
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
        <V4Content />
      </div>
    </CardDetailsContentProvider>
  );
}
