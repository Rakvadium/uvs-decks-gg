"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  RotateCcw,
  Plus,
  Minus,
  Zap,
  Shield,
  Swords,
  Heart,
  Gauge,
  Target,
  Copy,
  Hexagon,
} from "lucide-react";
import { CachedCard } from "@/lib/universus";
import { UNIVERSUS_KEYWORD_ABILITIES } from "@/config/universus";
import { SymbolIcon } from "./symbol-icon";
import { cn } from "@/lib/utils";
import { canAddCardToSection, getCardCopyLimit, getCardSectionCounts, useDeckEditor } from "@/lib/deck";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CardDetailsDialogProps {
  card: CachedCard | null;
  backCard?: CachedCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIMING_COLORS: Record<string, string> = {
  enhance: "#F1841B",
  response: "#009956",
  blitz: "#CD1181",
  form: "#0081C9",
};

const KEYWORD_ABILITY_MAP = new Map(
  UNIVERSUS_KEYWORD_ABILITIES.map(k => [k.name.toLowerCase(), k])
);

function KeywordBadge({ keyword }: { keyword: string }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const keywordName = keyword.replace(/[:\s]+\d+$/, "").trim();
  const abilityDef = KEYWORD_ABILITY_MAP.get(keywordName.toLowerCase());
  
  if (abilityDef && abilityDef.timing) {
    const color = TIMING_COLORS[abilityDef.timing];
    
    return (
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen} delayDuration={400}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-block px-2.5 py-0.5 text-xs font-semibold font-mono uppercase tracking-widest cursor-pointer transition-all hover:scale-105"
            style={{ 
              borderLeft: `2px solid ${color}`,
              borderTop: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              borderBottom: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              borderRight: `1px solid color-mix(in srgb, ${color} 15%, transparent)`,
              background: `linear-gradient(to right, ${color}35, ${color}10)`,
              color: color,
            }}
            onFocus={(e) => e.preventDefault()}
          >
            {keyword}
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs border-l-2 bg-background/80 backdrop-blur-md"
          style={{ 
            borderLeftColor: color,
            boxShadow: `0 0 20px ${color}20`,
          }}
          onPointerDownOutside={() => setTooltipOpen(false)}
        >
          <p className="text-sm font-mono text-foreground">
            {abilityDef.description}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <Badge variant="outline" className="text-xs">
      {keyword}
    </Badge>
  );
}

function AbilityText({ text }: { text: string }) {
  const segments = text.split("|").map(s => s.trim()).filter(Boolean);
  
  return (
    <div className="space-y-3">
      {segments.map((segment, idx) => {
        const colonIndex = segment.indexOf(":");
        
        if (colonIndex === -1) {
          return (
            <p key={idx} className="text-sm leading-relaxed">
              {segment}
            </p>
          );
        }
        
        const beforeColon = segment.slice(0, colonIndex);
        const afterColon = segment.slice(colonIndex);
        
        const abilityMatch = beforeColon.match(/^(.*?)(enhance|response|blitz|form)/i);
        
        if (!abilityMatch) {
          return (
            <p key={idx} className="text-sm leading-relaxed">
              {segment}
            </p>
          );
        }
        
        const prefix = abilityMatch[1];
        const abilityKeyword = abilityMatch[2];
        const abilityColor = TIMING_COLORS[abilityKeyword.toLowerCase()];
        const highlightedPart = prefix + abilityKeyword;
        const remainingBeforeColon = beforeColon.slice(highlightedPart.length);
        
        return (
          <p key={idx} className="text-sm leading-relaxed">
            <span 
              className="inline-block px-2.5 py-0.5 text-xs font-semibold font-mono uppercase tracking-widest"
              style={{ 
                borderLeft: `2px solid ${abilityColor}`,
                borderTop: `1px solid color-mix(in srgb, ${abilityColor} 30%, transparent)`,
                borderBottom: `1px solid color-mix(in srgb, ${abilityColor} 30%, transparent)`,
                background: `linear-gradient(to right, ${abilityColor}35, ${abilityColor}10)`,
                color: abilityColor,
              }}
            >
              {highlightedPart}
            </span>
            {remainingBeforeColon}
            {afterColon}
          </p>
        );
      })}
    </div>
  );
}

function StatBlock({ icon: Icon, label, value, color = "primary" }: { 
  icon: typeof Zap; 
  label: string; 
  value: string | number | undefined;
  color?: "primary" | "secondary" | "accent" | "destructive" | "orange";
}) {
  if (value === undefined || value === null) return null;
  
  const colorClasses = {
    primary: "text-primary border-primary/30 bg-primary/10",
    secondary: "text-secondary border-secondary/30 bg-secondary/10",
    accent: "text-accent border-accent/30 bg-accent/10",
    destructive: "text-destructive border-destructive/30 bg-destructive/10",
    orange: "text-orange-500 border-orange-500/30 bg-orange-500/10",
  };
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border",
      colorClasses[color]
    )}>
      <Icon className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-lg font-display font-bold">{value}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">{label}</span>
      </div>
    </div>
  );
}

function ZoneIndicator({ zone, label }: { zone: string | undefined; label: string }) {
  if (!zone) return null;
  
  const zoneConfig: Record<string, { label: string; textColor: string; borderColor: string; bgColor: string }> = {
    H: { label: "High", textColor: "text-red-500", borderColor: "border-red-500/30", bgColor: "bg-red-500/10" },
    M: { label: "Mid", textColor: "text-orange-500", borderColor: "border-orange-500/30", bgColor: "bg-orange-500/10" },
    L: { label: "Low", textColor: "text-yellow-500", borderColor: "border-yellow-500/30", bgColor: "bg-yellow-500/10" },
    high: { label: "High", textColor: "text-red-500", borderColor: "border-red-500/30", bgColor: "bg-red-500/10" },
    mid: { label: "Mid", textColor: "text-orange-500", borderColor: "border-orange-500/30", bgColor: "bg-orange-500/10" },
    low: { label: "Low", textColor: "text-yellow-500", borderColor: "border-yellow-500/30", bgColor: "bg-yellow-500/10" },
  };
  
  const normalizedZone = zone.toLowerCase().trim();
  const zoneParts = normalizedZone.includes(" ") || normalizedZone.includes("/") || normalizedZone.includes(",")
    ? normalizedZone.split(/[\s\/,]+/).filter(Boolean)
    : normalizedZone.length <= 3 
      ? normalizedZone.split("").map(z => z.toUpperCase())
      : [normalizedZone];
  
  const validZones = zoneParts
    .map(z => zoneConfig[z] || zoneConfig[z.toUpperCase()])
    .filter(Boolean);
  
  if (validZones.length === 0) return null;
  
  const primaryZone = validZones[0];
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border",
      primaryZone.borderColor,
      primaryZone.bgColor
    )}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          {validZones.map((z, i) => (
            <span key={i} className={cn("text-lg font-display font-bold", z.textColor)}>
              {z.label}{i < validZones.length - 1 ? <span className="text-muted-foreground/50 mx-0.5">/</span> : ""}
            </span>
          ))}
        </div>
        <span className={cn("text-[10px] font-mono uppercase tracking-widest opacity-70", primaryZone.textColor)}>{label}</span>
      </div>
    </div>
  );
}

export function CardDetailsDialog({ card, backCard, open, onOpenChange }: CardDetailsDialogProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { hasDeck, addCard, removeCard, mainCounts, sideCounts, referenceCounts } = useDeckEditor();

  const displayCard = card && isFlipped && backCard ? backCard : card;
  const hasBack = !!backCard;
  const sectionCounts = useMemo(
    () => ({ mainCounts, sideCounts, referenceCounts }),
    [mainCounts, sideCounts, referenceCounts]
  );
  const cardId = card?._id ?? "";
  const counts = useMemo(
    () => (card ? getCardSectionCounts(cardId, sectionCounts) : { main: 0, side: 0, reference: 0, mainSide: 0, total: 0 }),
    [card, cardId, sectionCounts]
  );
  const copyLimit = useMemo(() => getCardCopyLimit(card), [card]);

  if (!card || !displayCard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="p-0 overflow-hidden max-h-[90vh] md:pb-6" showCloseButton={false}>
        <DialogTitle className="sr-only">{displayCard.name} - Card Details</DialogTitle>
        <div className="flex flex-col lg:flex-row pb-16 md:pb-0">
          <div className="relative lg:w-[320px] shrink-0 bg-gradient-to-br from-background via-card to-background p-6 flex items-center justify-center lg:sticky lg:top-0 lg:self-start">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            <div className="relative z-10 w-full max-w-[250px]">
              <motion.div
                className="relative aspect-[2.5/3.5] w-full"
                style={{ perspective: 1000 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isFlipped ? "back" : "front"}
                    initial={prefersReducedMotion ? {} : { rotateY: -90, opacity: 0 }}
                    animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
                    exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_0_22px_-12px_var(--primary)]"
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
                      <div className="w-full h-full flex items-center justify-center bg-muted/50 border border-border/50">
                        <div className="text-center">
                          <Hexagon className="h-12 w-12 mx-auto mb-2 text-primary/30" />
                          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">No Image</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-xl opacity-50 -z-10" />
              </motion.div>

              <div className="flex items-center justify-center gap-2 mt-4">
                {hasBack && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="gap-2"
                  >
                    <RotateCcw className={cn(
                      "h-4 w-4",
                      !prefersReducedMotion && "transition-transform duration-300",
                      isFlipped && "rotate-180"
                    )} />
                    <span className="font-mono uppercase tracking-wider text-xs">
                      {isFlipped ? "Front" : "Back"}
                    </span>
                  </Button>
                )}
              </div>

              {hasDeck && (
                <div className="mt-4 space-y-2">
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center">
                    Deck Sections
                  </span>
                  {([
                    {
                      key: "main",
                      label: "Main",
                      count: counts.main,
                      canAdd: canAddCardToSection({ card, cardId: card._id, section: "main", counts: sectionCounts }),
                    },
                    {
                      key: "side",
                      label: "Side",
                      count: counts.side,
                      canAdd: canAddCardToSection({ card, cardId: card._id, section: "side", counts: sectionCounts }),
                    },
                    {
                      key: "reference",
                      label: "Reference",
                      count: counts.reference,
                      canAdd: canAddCardToSection({ card, cardId: card._id, section: "reference", counts: sectionCounts }),
                    },
                  ] as const).map((section) => (
                    <div
                      key={section.key}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-card/40 px-2.5 py-1.5"
                    >
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {section.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => removeCard(card._id, section.key)}
                          disabled={section.count === 0}
                          className="border-destructive/30 hover:border-destructive hover:bg-destructive/10"
                        >
                          <Minus className="h-4 w-4 text-destructive" />
                        </Button>
                        <span className="w-7 text-center font-mono font-bold text-primary text-xs">
                          {section.count}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => addCard(card._id, section.key)}
                          disabled={!section.canAdd}
                          className="border-primary/30 hover:border-primary hover:bg-primary/10"
                        >
                          <Plus className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {copyLimit !== Number.POSITIVE_INFINITY && (
                    <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center">
                      Limit {copyLimit} in Main/Side
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <CardDetailsContent card={displayCard} />
        </div>
        <DialogFooter className="md:hidden">
          <DialogClose asChild>
            <div className="flex items-center justify-end w-full">
              <Button
                  className="gap-2 ml-auto"
              >
                <span className="font-mono uppercase tracking-wider text-xs">Close</span>
              </Button>
            </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CardDetailsContent({ card, className }: { card: CachedCard; className?: string }) {
  const symbols = useMemo(() => {
    if (!card.symbols) return [];
    const rawSymbols = card.symbols
      .split(/[,|]/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    return [...new Set(rawSymbols)];
  }, [card.symbols]);
  
  const keywords = useMemo(() => {
    if (!card.keywords) return [];
    return card.keywords
      .split(/[,|]/)
      .map(k => k.trim())
      .filter(Boolean);
  }, [card.keywords]);
  
  const showRarity = card.rarity && 
    card.rarity.toLowerCase() !== card.type?.toLowerCase();

  return (
    <div className={cn("flex-1 overflow-y-auto p-6 space-y-6", className)}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide">
            {card.name}
          </h2>
          {card.collectorNumber && (
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              #{card.collectorNumber}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {card.type && (
            <Badge variant="cyber">{card.type}</Badge>
          )}
          {showRarity && (
            <Badge variant="outline">{card.rarity}</Badge>
          )}
          {card.setName && (
            <Badge variant="secondary">{card.setName}</Badge>
          )}
          {symbols.length > 0 && (
            <>
              <div className="h-4 w-px bg-border/50 mx-1" />
              <div className="flex items-center gap-1.5">
                {symbols.map((symbol) => (
                  <div
                    key={symbol}
                    className="hover:scale-110 transition-transform"
                    title={symbol.charAt(0).toUpperCase() + symbol.slice(1)}
                  >
                    <SymbolIcon symbol={symbol} size="md" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {(card.control !== undefined || card.difficulty !== undefined || card.blockZone || card.blockModifier !== undefined || card.health !== undefined || card.stamina !== undefined || card.handSize !== undefined) && (
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">General</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatBlock icon={Gauge} label="Difficulty" value={card.difficulty} color="orange" />
            <StatBlock icon={Shield} label="Check" value={card.control} color="primary" />
            {(card.blockZone || card.blockModifier !== undefined) && (
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <ZoneIndicator zone={card.blockZone} label="Block Zone" />
                <StatBlock icon={Target} label="Block Mod" value={card.blockModifier} color="secondary" />
              </div>
            )}
            <StatBlock icon={Heart} label="Health" value={card.health} color="destructive" />
            {card.stamina && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary/30 bg-secondary/10">
                <Gauge className="h-4 w-4 text-secondary" />
                <div className="flex flex-col">
                  <span className="text-lg font-display font-bold text-secondary">{card.stamina}</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-70 text-secondary">Vitality</span>
                </div>
              </div>
            )}
            {card.handSize && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/10">
                <Copy className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-lg font-display font-bold text-primary">{card.handSize}</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-70 text-primary">Hand Size</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(card.speed !== undefined || card.attackZone || card.damage !== undefined) && (
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Attack</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatBlock icon={Zap} label="Speed" value={card.speed} color="accent" />
            <ZoneIndicator zone={card.attackZone} label="Zone" />
            <StatBlock icon={Swords} label="Damage" value={card.damage} color="accent" />
          </div>
        </div>
      )}

      {keywords.length > 0 && (() => {
        const keywordAbilities: string[] = [];
        const otherKeywords: string[] = [];
        
        keywords.forEach(kw => {
          const keywordName = kw.replace(/[:\s]+\d+$/, "").trim();
          if (KEYWORD_ABILITY_MAP.has(keywordName.toLowerCase())) {
            keywordAbilities.push(kw);
          } else {
            otherKeywords.push(kw);
          }
        });
        
        keywordAbilities.sort((a, b) => a.localeCompare(b));
        otherKeywords.sort((a, b) => a.localeCompare(b));
        
        return (
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Keywords</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {keywordAbilities.map((keyword, i) => (
                <KeywordBadge key={`ability-${i}`} keyword={keyword} />
              ))}
              {keywordAbilities.length > 0 && otherKeywords.length > 0 && (
                <span className="text-muted-foreground/50 mx-1 font-mono">/</span>
              )}
              {otherKeywords.map((keyword, i) => (
                <KeywordBadge key={`other-${i}`} keyword={keyword} />
              ))}
            </div>
          </div>
        );
      })()}

      {card.text && (
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Card Text</span>
          <div className="p-4 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm">
            <AbilityText text={card.text} />
          </div>
        </div>
      )}

      {card.copyLimit && (
        <div className="flex items-center gap-2 text-sm">
          <Copy className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">
            Limit: <span className="text-foreground font-bold">{card.copyLimit}</span> in Main/Side
          </span>
        </div>
      )}

      <Separator className="bg-border/30" />

      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span className="uppercase tracking-widest">
          {card.setCode} • {card.rarity}
        </span>
        {card.oracleId && (
          <span className="opacity-50">
            Oracle: {card.oracleId.slice(0, 8)}...
          </span>
        )}
      </div>
    </div>
  );
}
