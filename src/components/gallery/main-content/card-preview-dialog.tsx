"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Eye, FlipHorizontal, Layers, Minus, MousePointer, Plus, Sparkles, UserRound, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { CardGridItem, CardDetailsDialog } from "@/components/universus";
import { CARD_GLOW_REST } from "@/components/universus/card-item/glow";
import { useCardData, type CachedCard } from "@/lib/universus";
import { cn } from "@/lib/utils";

interface CardPreviewSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

function CardPreviewSection({ title, description, icon, badge, children, className }: CardPreviewSectionProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {badge && (
              <Badge variant="outline" className="h-4 px-1.5 font-mono text-[9px] uppercase tracking-wider">
                {badge}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}

function HeroCardMockup() {
  return (
    <div className="relative h-48 w-36 shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-card shadow-[0_0_0_1px_var(--primary)/15,0_0_8px_var(--primary)/30]">
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 via-card to-secondary/5">
        <UserRound className="h-16 w-16 text-primary/20" />
      </div>

      <button
        type="button"
        className={cn(
          "absolute right-0 top-0 z-20 flex h-8 w-8 items-center justify-center",
          "rounded-tr-lg rounded-bl-lg rounded-tl-none rounded-br-none",
          "bg-background/80 backdrop-blur-sm",
          "border-l border-b border-border/40",
        )}
        aria-label="Change character (mock)"
      >
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <div
        className={cn(
          "absolute bottom-0 left-0 z-20 flex h-9 w-9 items-center justify-center",
          "rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none",
          "bg-background/80 backdrop-blur-sm",
          "border-r border-t border-border/40",
        )}
        aria-label="Symbol (mock)"
      >
        <div className="h-4 w-4 rounded-full border-2 border-primary/40" />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-background/40 to-transparent" />
    </div>
  );
}


function StackedCardMockup({ card }: { card: CachedCard }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const quantity = 4;
  const stackOffset = 2;
  const stackedLayers = [1, 2, 3, 4];

  return (
    <>
      <div className="w-44 group">
        <div className="relative pb-3 pr-3">
          <div className="relative aspect-[2.5/3.5] overflow-visible transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            {stackedLayers.map((layer) => (
              <div
                key={layer}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-lg border border-border/60 bg-muted/60"
                style={{
                  transform: `translate(${layer * stackOffset}px, ${layer * stackOffset}px)`,
                  opacity: Math.max(0.4, 0.85 - layer * 0.12),
                  boxShadow: "1px 1px 0 0 hsl(var(--border) / 0.4)",
                }}
              />
            ))}

            <div
              className="absolute inset-0 z-10 overflow-hidden rounded-lg"
              style={{ boxShadow: CARD_GLOW_REST }}
            >
              {card.imageUrl && (
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  sizes="176px"
                  className="object-cover"
                  draggable={false}
                />
              )}
            </div>

            <div
              className={cn(
                "absolute bottom-0 right-0 z-30 flex flex-col items-center overflow-hidden",
                "rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none",
                "bg-background/80 backdrop-blur-sm",
                "border-l border-t border-border/40"
              )}
            >
              <div className="flex h-6 w-7 items-center justify-center text-primary">
                <Plus className="h-3 w-3" />
              </div>
              <div className="flex h-6 w-7 items-center justify-center border-t border-b border-border/40 font-mono text-xs font-bold text-primary">
                {quantity}
              </div>
              <div className="flex h-6 w-7 items-center justify-center text-destructive">
                <Minus className="h-3 w-3" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="absolute inset-0 z-20 cursor-pointer rounded-lg"
              aria-label={`Open ${card.name} details`}
            />
          </div>
        </div>
      </div>

      <CardDetailsDialog card={card} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}

interface CardPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardPreviewDialog({ open, onOpenChange }: CardPreviewDialogProps) {
  const { cards } = useCardData();

  const demoCards = useMemo(() => {
    const cardIdMap = new Map(cards.map((c) => [c._id, c]));
    const specificCard = cardIdMap.get("k17ae9fxg110br5qbej5stek0182q7vd" as (typeof cards)[0]["_id"]);
    const frontFace = cards.filter((c) => c.isFrontFace !== false && c.isVariant !== true);
    const withBack = frontFace.find((c) => !!c.backCardId);
    const standardCard = specificCard ?? frontFace.find((c) => !c.backCardId);
    const backCard = withBack?.backCardId ? cardIdMap.get(withBack.backCardId) : undefined;
    const getBackCard = (card: (typeof cards)[0]) =>
      card.backCardId ? (cardIdMap.get(card.backCardId) ?? null) : null;
    return { standardCard, withBack, backCard, cardIdMap, getBackCard };
  }, [cards]);

  const previewCards = useMemo(
    () => [demoCards.standardCard, demoCards.withBack].filter(Boolean) as typeof cards,
    [demoCards]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-display text-lg font-bold">Card Item Design Preview</DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Hover over cards to see interactive states. Temporary design review tool.
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <CardPreviewSection
              title="Standard Gallery Card"
              description="Base card with glow border. Hover to reveal deck controls (+/−) stacked vertically on the bottom-right. Click to open card details."
              icon={<Eye className="h-3.5 w-3.5 text-primary" />}
              badge="No Flip"
            >
              {demoCards.standardCard ? (
                <div className="w-32">
                  <CardNavigationProvider cards={previewCards} getBackCard={demoCards.getBackCard}>
                    <CardGridItem card={demoCards.standardCard} />
                  </CardNavigationProvider>
                </div>
              ) : (
                <div className="flex h-44 w-32 items-center justify-center rounded-xl border border-dashed border-border/50">
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              )}
            </CardPreviewSection>

            <CardPreviewSection
              title="Card with Back Side"
              description="Cards with a back face show a flip button in the top-left corner, flush with the card edge. Faded at rest, full opacity on hover. Click to flip with animation."
              icon={<FlipHorizontal className="h-3.5 w-3.5 text-primary" />}
              badge="Has Flip"
            >
              {demoCards.withBack ? (
                <div className="w-32">
                  <CardNavigationProvider cards={previewCards} getBackCard={demoCards.getBackCard}>
                    <CardGridItem
                      card={demoCards.withBack}
                      backCard={demoCards.backCard}
                    />
                  </CardNavigationProvider>
                </div>
              ) : (
                <div className="flex h-44 w-32 items-center justify-center rounded-xl border border-dashed border-border/50">
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              )}
            </CardPreviewSection>

            <CardPreviewSection
              title="Deck Controls"
              description="When a deck is active, the count badge appears in the bottom-right corner when cards are in deck. Hover to reveal + / − buttons above and below the count."
              icon={<Layers className="h-3.5 w-3.5 text-primary" />}
              badge="Deck Mode"
            >
              <div className="flex w-32 flex-col gap-2">
                {demoCards.standardCard ? (
                  <CardNavigationProvider cards={previewCards} getBackCard={demoCards.getBackCard}>
                    <CardGridItem card={demoCards.standardCard} />
                  </CardNavigationProvider>
                ) : (
                  <div className="flex h-44 w-32 items-center justify-center rounded-xl border border-dashed border-border/50">
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                )}
                <p className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Load a deck to see controls
                </p>
              </div>
            </CardPreviewSection>

            <CardPreviewSection
              title="Stacked Card (Deck View)"
              description="Shows quantity as physical card layers. Hover to shift the stack. Vertical deck controls flush to bottom-right. Click anywhere to open card details."
              icon={<Layers className="h-3.5 w-3.5 text-primary" />}
              badge="Deck Details"
            >
              {demoCards.standardCard ? (
                <StackedCardMockup card={demoCards.standardCard} />
              ) : (
                <div className="flex h-44 w-32 items-center justify-center rounded-xl border border-dashed border-border/50">
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              )}
            </CardPreviewSection>

            <CardPreviewSection
              title="Starting Character Card"
              description="The hero panel uses the same glow border. Symbol selector sits in the bottom-left corner (flush). A change-character button appears in the top-right. Clicking the image opens card details."
              icon={<MousePointer className="h-3.5 w-3.5 text-primary" />}
              badge="Hero Panel"
            >
              <HeroCardMockup />
            </CardPreviewSection>
          </div>

          <div className="border-t border-border/50 px-6 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Design Notes</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>Border glow effect is always present — subtle at rest, brightens on hover.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>Flip button: top-left flush corner, <code className="rounded bg-muted px-1">rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>Deck controls: bottom-right flush corner, vertical stack (+/count/−), count always visible when &gt;0, controls appear on hover.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>Drag cursor shows when card is draggable (gallery context). Hand pointer otherwise.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>Stacked card: physical layer offset conveys quantity. Same glow border and flush corner controls as gallery cards.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>Hero panel: click image → card details dialog. Top-right button → character picker. Bottom-left → symbol selector.</span>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CardPreviewDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-primary/30 font-mono text-xs uppercase tracking-wider hover:border-primary/60 hover:bg-primary/5"
      >
        <Eye className="h-3.5 w-3.5 text-primary" />
        Card Preview
      </Button>
      <CardPreviewDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
