"use client";

/**
 * V3 - "Terminal"
 * A retro-futuristic terminal/CLI aesthetic. Stats displayed as
 * labeled key:value pairs in a monospaced readout format.
 * Scanline effects, green-on-dark accents, typed-out feel.
 * Image on the left with a data terminal on the right.
 */

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Hexagon, RotateCcw } from "lucide-react";
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

/* ── Terminal line ─────────────────────────────────────────────── */

function TermLine({ label, value, color }: { label: string; value: string | number | undefined; color?: string }) {
  if (value === undefined || value === null) return null;

  return (
    <div className="flex items-baseline gap-1 font-mono text-sm">
      <span className="text-emerald-500/60">$</span>
      <span className="text-muted-foreground/70">{label}:</span>
      <span className="font-bold" style={{ color: color || "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}

/* ── Content ───────────────────────────────────────────────────── */

function V3Content() {
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
    <div className="flex-1 overflow-y-auto p-5 font-mono">
      {/* Terminal header */}
      <div className="mb-4 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2 text-[10px] text-emerald-500/40">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/50" />
          <span>UVS://CARD_DATABASE/{card.setCode?.toUpperCase()}/{card.collectorNumber}</span>
        </div>
        <h2 className="mt-2 text-xl font-display font-bold uppercase tracking-wider text-foreground">
          {card.name}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {card.type && (
            <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-400">
              {card.type}
            </span>
          )}
          {showRarity && (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              [{card.rarity}]
            </span>
          )}
          {card.setName && (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              {card.setName}
            </span>
          )}
          {symbols.length > 0 && (
            <>
              <span className="text-emerald-500/20">|</span>
              <div className="flex items-center gap-1">
                {symbols.map((s) => (
                  <SymbolIcon key={s} symbol={s} size="md" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats readout */}
      {hasGeneralStats && (
        <div className="mb-4 rounded border border-border/20 bg-background/50 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-emerald-500/50">
            &gt;&gt; GENERAL_STATS
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            <TermLine label="DIFFICULTY" value={card.difficulty} color="#f97316" />
            <TermLine label="CHECK" value={card.control} color="#3b82f6" />
            <TermLine label="BLOCK_ZONE" value={card.blockZone?.toUpperCase()} color="#ef4444" />
            <TermLine label="BLOCK_MOD" value={card.blockModifier} color="#a855f7" />
            <TermLine label="HEALTH" value={card.health} color="#ef4444" />
            <TermLine label="VITALITY" value={card.stamina} color="#8b5cf6" />
            <TermLine label="HAND_SIZE" value={card.handSize} color="#3b82f6" />
          </div>
        </div>
      )}

      {hasAttackStats && (
        <div className="mb-4 rounded border border-accent/20 bg-accent/5 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-accent/50">
            &gt;&gt; ATTACK_STATS
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            <TermLine label="SPEED" value={card.speed} color="var(--accent)" />
            <TermLine label="ZONE" value={card.attackZone?.toUpperCase()} color="var(--accent)" />
            <TermLine label="DAMAGE" value={card.damage} color="var(--accent)" />
          </div>
        </div>
      )}

      {/* Keywords */}
      {(keywordAbilities.length > 0 || otherKeywords.length > 0) && (
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] uppercase tracking-widest text-emerald-500/50">
            &gt;&gt; KEYWORDS
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {keywordAbilities.map((kw, i) => <KeywordBadge key={`a-${i}`} keyword={kw} />)}
            {keywordAbilities.length > 0 && otherKeywords.length > 0 && (
              <span className="mx-1 text-emerald-500/20">|</span>
            )}
            {otherKeywords.map((kw, i) => <KeywordBadge key={`o-${i}`} keyword={kw} />)}
          </div>
        </div>
      )}

      {/* Card text */}
      {card.text && (
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] uppercase tracking-widest text-emerald-500/50">
            &gt;&gt; CARD_TEXT
          </div>
          <div className="rounded border border-border/20 bg-background/40 p-3">
            <AbilityText text={card.text} />
          </div>
        </div>
      )}

      {/* Copy limit + Starting Character */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {card.copyLimit && (
          <span className="text-xs text-muted-foreground">
            <Copy className="mr-1 inline h-3.5 w-3.5" />
            LIMIT: {card.copyLimit}
          </span>
        )}
        <StartingCharacterButton card={card} compact />
      </div>

      {/* Deck controls */}
      <DeckSectionControls card={card} />

      {/* Meta footer */}
      <div className="mt-4 border-t border-emerald-500/10 pt-2 text-[10px] text-emerald-500/30">
        <span>SET:{card.setCode} RARITY:{card.rarity}</span>
        {card.oracleId && <span className="ml-4">OID:{card.oracleId.slice(0, 8)}</span>}
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────── */

export function CardDetailsV3({
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
        {/* Image panel with scanline overlay */}
        <div className="relative flex shrink-0 items-center justify-center bg-black/30 p-6 lg:sticky lg:top-0 lg:w-[300px] lg:self-start">
          {/* Scanline effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)",
            }}
          />
          <div className="absolute left-0 right-0 top-0 h-px bg-emerald-500/30" />

          <div className="relative z-10 w-full max-w-[230px]">
            <motion.div className="relative aspect-[2.5/3.5] w-full" style={{ perspective: 1000 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isFlipped ? "back" : "front"}
                  initial={prefersReducedMotion ? {} : { rotateY: -90, opacity: 0 }}
                  animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
                  exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 overflow-hidden rounded-lg border border-emerald-500/20"
                  style={{ boxShadow: "0 0 25px -8px rgba(16,185,129,0.3)" }}
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
                    <div className="flex h-full w-full items-center justify-center bg-black/50">
                      <Hexagon className="h-12 w-12 text-emerald-500/30" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {hasBack && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleFlip}
                  className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
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

        {/* Terminal content */}
        <V3Content />
      </div>
    </CardDetailsContentProvider>
  );
}
