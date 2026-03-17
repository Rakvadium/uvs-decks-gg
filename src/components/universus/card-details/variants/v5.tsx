"use client";

/**
 * V5 - "Datastream"
 * A dense, data-rich layout inspired by sci-fi data dashboards.
 * Image on left, title + key stats in a top banner, then a tabbed
 * lower section with abilities, keywords, and deck controls.
 * Stats shown as compact hex-labeled indicators in a single row.
 */

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  Hexagon,
  RotateCcw,
} from "lucide-react";
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

/* ── Hex stat (hexagonal-ish compact indicator) ────────────────── */

function HexStat({
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
    <div className="flex flex-col items-center">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-md font-display text-base font-bold"
        style={{
          color,
          background: `${color}12`,
          border: `1px solid ${color}30`,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        {value}
      </div>
      <span className="mt-1 text-[8px] font-mono uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

/* ── Content ───────────────────────────────────────────────────── */

function V5Content() {
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
    <div className="flex-1 overflow-y-auto">
      {/* Top banner - title + type */}
      <div className="border-b border-border/20 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-display font-bold uppercase tracking-wider">
              {card.name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {card.type && <Badge variant="cyber" className="text-[10px]">{card.type}</Badge>}
              {showRarity && (
                <Badge variant="outline" className="text-[10px]">{card.rarity}</Badge>
              )}
              {card.setName && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
                  {card.setName}
                </span>
              )}
              {symbols.length > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  {symbols.map((s) => (
                    <SymbolIcon key={s} symbol={s} size="sm" />
                  ))}
                </div>
              )}
            </div>
          </div>
          {card.collectorNumber && (
            <span className="text-[10px] font-mono text-muted-foreground/30">
              #{card.collectorNumber}
            </span>
          )}
        </div>
      </div>

      {/* Stats strip - hex indicators in a horizontal row */}
      {(hasGeneralStats || hasAttackStats) && (
        <div className="flex flex-wrap items-end justify-center gap-3 border-b border-border/20 px-5 py-4">
          {card.difficulty !== undefined && (
            <HexStat label="Diff" value={card.difficulty} color="#f97316" />
          )}
          {card.control !== undefined && (
            <HexStat label="Check" value={card.control} color="#3b82f6" />
          )}
          {card.blockZone && (
            <HexStat label="Blk Zn" value={card.blockZone.toUpperCase()} color="#ef4444" />
          )}
          {card.blockModifier !== undefined && (
            <HexStat label="Blk Mod" value={card.blockModifier} color="#a855f7" />
          )}
          {card.health !== undefined && (
            <HexStat label="HP" value={card.health} color="#ef4444" />
          )}
          {card.stamina !== undefined && (
            <HexStat label="Vital" value={card.stamina} color="#8b5cf6" />
          )}
          {card.handSize !== undefined && (
            <HexStat label="Hand" value={card.handSize} color="#3b82f6" />
          )}

          {hasAttackStats && (
            <>
              <div className="h-8 w-px bg-accent/20" />
              {card.speed !== undefined && (
                <HexStat label="Speed" value={card.speed} color="var(--accent)" />
              )}
              {card.attackZone && (
                <HexStat label="Atk Zn" value={card.attackZone.toUpperCase()} color="var(--accent)" />
              )}
              {card.damage !== undefined && (
                <HexStat label="Dmg" value={card.damage} color="var(--accent)" />
              )}
            </>
          )}
        </div>
      )}

      {/* Body - keywords, text, deck controls */}
      <div className="space-y-4 px-5 py-4">
        {/* Keywords */}
        {(keywordAbilities.length > 0 || otherKeywords.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {keywordAbilities.map((kw, i) => <KeywordBadge key={`a-${i}`} keyword={kw} />)}
            {keywordAbilities.length > 0 && otherKeywords.length > 0 && (
              <span className="mx-1 font-mono text-muted-foreground/20">/</span>
            )}
            {otherKeywords.map((kw, i) => <KeywordBadge key={`o-${i}`} keyword={kw} />)}
          </div>
        )}

        {/* Card text */}
        {card.text && (
          <div className="rounded border border-border/20 bg-card/20 p-3">
            <AbilityText text={card.text} />
          </div>
        )}

        {/* Actions row */}
        <div className="flex flex-wrap items-center gap-3">
          {card.copyLimit && (
            <span className="text-[10px] font-mono text-muted-foreground/50">
              <Copy className="mr-1 inline h-3 w-3" />
              LIMIT:{card.copyLimit}
            </span>
          )}
          <StartingCharacterButton card={card} compact />
        </div>

        {/* Deck controls */}
        <DeckSectionControls card={card} />

        {/* Meta */}
        <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-muted-foreground/30 uppercase tracking-widest">
          <span>{card.setCode} · {card.rarity}</span>
          {card.oracleId && <span>OID:{card.oracleId.slice(0, 8)}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────── */

export function CardDetailsV5({
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
        {/* Image panel - compact with data overlay */}
        <div className="relative flex shrink-0 items-center justify-center bg-gradient-to-br from-card via-background to-card p-6 lg:sticky lg:top-0 lg:w-[280px] lg:self-start">
          {/* Corner accents */}
          <div className="absolute left-0 top-0 h-8 w-px bg-gradient-to-b from-primary/40 to-transparent" />
          <div className="absolute left-0 top-0 h-px w-8 bg-gradient-to-r from-primary/40 to-transparent" />
          <div className="absolute bottom-0 right-0 h-8 w-px bg-gradient-to-t from-secondary/40 to-transparent" />
          <div className="absolute bottom-0 right-0 h-px w-8 bg-gradient-to-l from-secondary/40 to-transparent" />

          <div className="relative z-10 w-full max-w-[220px]">
            <motion.div className="relative aspect-[2.5/3.5] w-full" style={{ perspective: 1000 }}>
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={isFlipped ? "back" : "front"}
                  initial={false}
                  animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
                  exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 overflow-hidden rounded-lg"
                  style={{
                    boxShadow: "0 4px 30px -10px var(--primary), 0 0 0 1px var(--primary)/20",
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
                    <div className="flex h-full w-full items-center justify-center bg-muted/30">
                      <Hexagon className="h-10 w-10 text-primary/20" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {hasBack && (
              <div className="mt-3 flex justify-center">
                <Button variant="outline" size="sm" onClick={onToggleFlip} className="gap-2">
                  <RotateCcw
                    className={cn(
                      "h-3.5 w-3.5",
                      !prefersReducedMotion && "transition-transform duration-150",
                      isFlipped && "rotate-180"
                    )}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    {isFlipped ? "Front" : "Back"}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <V5Content />
      </div>
    </CardDetailsContentProvider>
  );
}
