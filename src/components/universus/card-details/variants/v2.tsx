"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Hexagon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SymbolIcon } from "../../symbol-icon";
import { AbilityText } from "../ability-text";
import { SectionHeading } from "@/components/ui/typography-headings";
import {
  CardDetailsContentProvider,
  useCardDetailsContent,
} from "../content-context";
import { KeywordBadge } from "../keyword-badge";
import type { CardDetailsVariantProps } from "./types";

const BAR_WIDTH = 36;

function StatCell({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const fill = Math.min(value / max, 1);

  return (
    <div className="flex flex-col items-center" style={{ minWidth: BAR_WIDTH }}>
      <span
        className="font-display text-lg font-bold leading-none tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
      <div
        className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full"
        style={{ backgroundColor: `${color}18` }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${fill * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="mt-1 text-[8px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

function ZoneCell({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center" style={{ minWidth: BAR_WIDTH }}>
      <span
        className="font-display text-lg font-bold uppercase leading-none"
        style={{ color }}
      >
        {value}
      </span>
      <div className="mt-1.5 h-[3px] w-full" />
      <span className="mt-1 text-[8px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

function StatGroup({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[9px] font-mono font-bold uppercase tracking-[0.25em]"
        style={{ color }}
      >
        {label}
      </span>
      <div className="flex flex-wrap items-end gap-3 md:gap-4">{children}</div>
    </div>
  );
}

function V2Content() {
  const { card, symbols, keywordAbilities, otherKeywords } =
    useCardDetailsContent();

  const hasGeneral =
    card.difficulty !== undefined ||
    card.control !== undefined ||
    card.handSize !== undefined ||
    card.stamina !== undefined ||
    card.health !== undefined;

  const hasBlock = card.blockZone || card.blockModifier !== undefined;

  const hasAttack =
    card.speed !== undefined ||
    card.attackZone ||
    card.damage !== undefined;

  const hasKeywords = keywordAbilities.length > 0 || otherKeywords.length > 0;
  const hasAnyStats = hasGeneral || hasBlock || hasAttack;

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-5 md:p-6">
      <div>
        <SectionHeading className="font-display text-xl font-bold uppercase tracking-wide md:text-2xl">
          {card.name}
        </SectionHeading>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {card.type && (
            <span
              className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-[0.12em]"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                boxShadow: "var(--chrome-badge-default-shadow)",
              }}
            >
              {card.type}
            </span>
          )}
          {symbols.length > 0 && (
            <div className="flex items-center gap-1">
              {symbols.map((s) => (
                <SymbolIcon key={s} symbol={s} size="md" />
              ))}
            </div>
          )}
        </div>
      </div>

      {hasAnyStats && (
        <div className="flex flex-wrap items-start gap-4 md:gap-6">
          {hasGeneral && (
            <StatGroup label="General" color="#6366f1">
              {card.difficulty !== undefined && (
                <StatCell value={card.difficulty} max={8} label="Diff" color="#6366f1" />
              )}
              {card.control !== undefined && (
                <StatCell value={card.control} max={6} label="Check" color="#6366f1" />
              )}
              {card.handSize !== undefined && (
                <StatCell value={card.handSize} max={8} label="Hand" color="#6366f1" />
              )}
              {card.health !== undefined && (
                <StatCell value={card.health} max={30} label="HP" color="#ef4444" />
              )}
              {card.stamina !== undefined && (
                <StatCell value={card.stamina} max={30} label="Vitality" color="#8b5cf6" />
              )}
            </StatGroup>
          )}

          {hasBlock && (
            <StatGroup label="Block" color="#ef4444">
              {card.blockZone && (
                <ZoneCell value={card.blockZone} label="Zone" color="#ef4444" />
              )}
              {card.blockModifier !== undefined && (
                <StatCell
                  value={card.blockModifier}
                  max={5}
                  label="Mod"
                  color="#ef4444"
                />
              )}
            </StatGroup>
          )}

          {hasAttack && (
            <StatGroup label="Attack" color="#f59e0b">
              {card.speed !== undefined && (
                <StatCell value={card.speed} max={8} label="Speed" color="#f59e0b" />
              )}
              {card.attackZone && (
                <ZoneCell value={card.attackZone} label="Zone" color="#f59e0b" />
              )}
              {card.damage !== undefined && (
                <StatCell value={card.damage} max={8} label="Dmg" color="#f59e0b" />
              )}
            </StatGroup>
          )}
        </div>
      )}

      {hasKeywords && (
        <div className="flex flex-wrap items-center gap-1.5">
          {keywordAbilities.map((kw, i) => (
            <KeywordBadge key={`a-${i}`} keyword={kw} />
          ))}
          {keywordAbilities.length > 0 && otherKeywords.length > 0 && (
            <div className="mx-0.5 h-4 w-px bg-border/30" />
          )}
          {otherKeywords.map((kw, i) => (
            <KeywordBadge key={`o-${i}`} keyword={kw} />
          ))}
        </div>
      )}

      {card.text && <AbilityText text={card.text} />}
    </div>
  );
}

export function CardDetailsV2({
  card,
  displayCard,
  backCard,
  hasBack,
  isFlipped,
  onToggleFlip,
  mobileNavigationPrevious,
  mobileNavigationNext,
}: CardDetailsVariantProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <CardDetailsContentProvider card={displayCard}>
      <div className="flex flex-col lg:flex-row">
        <div className="relative flex shrink-0 flex-col items-center justify-center p-4 md:p-6 lg:sticky lg:top-0 lg:w-[400px] lg:self-start">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-card/20 to-background/80" />
          <div className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-border/40 to-transparent lg:block" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent lg:hidden" />

          <div className="relative z-10 w-full">
            <div className="flex items-center justify-center gap-3">
              <div
                className={cn(
                  "shrink-0 justify-center md:hidden",
                  mobileNavigationPrevious ? "flex w-10" : "hidden"
                )}
              >
                {mobileNavigationPrevious}
              </div>
              <div className="w-full max-w-[260px] md:max-w-[340px]">
                <motion.div
                  className="relative aspect-[2.5/3.5] w-full"
                  style={{ perspective: 1000 }}
                >
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={isFlipped ? "back" : "front"}
                      initial={false}
                      animate={
                        prefersReducedMotion
                          ? {}
                          : { rotateY: 0, opacity: 1 }
                      }
                      exit={
                        prefersReducedMotion
                          ? {}
                          : { rotateY: 90, opacity: 0 }
                      }
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 overflow-hidden rounded-2xl"
                      style={{
                        boxShadow: "var(--chrome-card-image-glow-rest)",
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
                    <button
                      type="button"
                      onClick={onToggleFlip}
                      className="flex items-center gap-2 rounded-full border border-border/30 bg-card/60 px-3 py-1.5 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                    >
                      <RotateCcw
                        className={cn(
                          "h-3.5 w-3.5",
                          !prefersReducedMotion &&
                            "transition-transform duration-150",
                          isFlipped && "rotate-180"
                        )}
                      />
                      <span className="text-[10px] font-mono uppercase tracking-[0.15em]">
                        {isFlipped ? "Front" : "Back"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "shrink-0 justify-center md:hidden",
                  mobileNavigationNext ? "flex w-10" : "hidden"
                )}
              >
                {mobileNavigationNext}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto">
          <V2Content />
        </div>
      </div>
    </CardDetailsContentProvider>
  );
}
