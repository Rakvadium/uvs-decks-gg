"use client";

import { AnimatePresence } from "framer-motion";
import * as m from "framer-motion/m";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { Layers3, Presentation } from "lucide-react";
import { CardGridItem } from "@/components/universus/card-grid-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCommunityTierListDetailContext } from "./context";
import { CommunityTierListPresentationCard } from "./presentation-card";

export function CommunityTierListDetailPoolPanel() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const {
    canEdit,
    poolCardIds,
    poolSearch,
    setPoolSearch,
    setIsPoolDialogOpen,
    filteredPoolCardIds,
    cardMap,
    getBackCard,
    poolScopes,
    isPresentationMode,
    setIsPresentationMode,
    presentationCard,
  } = useCommunityTierListDetailContext();

  if (!canEdit) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-border/50 bg-background/92 backdrop-blur-xl">
      <AnimatePresence>
        {isPresentationMode && presentationCard ? (
          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: "easeOut" }}
            className="absolute bottom-full right-0 z-30"
          >
            <CommunityTierListPresentationCard />
          </m.div>
        ) : null}
      </AnimatePresence>

      <div className="border-b border-border/50 bg-card/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Card Pool</p>
            </div>
            <p className="mt-1 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {poolCardIds.length} cards waiting to be ranked
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:items-center">
            {!isPresentationMode ? (
              <Input
                value={poolSearch}
                onChange={(event) => setPoolSearch(event.target.value)}
                placeholder="Search the pool"
                className="h-10 min-w-0 sm:w-64"
              />
            ) : null}
            <Button
              variant={isPresentationMode ? "secondary" : "outline"}
              className={cn("h-10", isPresentationMode && "border-primary/40")}
              onClick={() => setIsPresentationMode((current) => !current)}
            >
              <Presentation className="h-4 w-4" />
              {isPresentationMode ? "Exit Presentation" : "Enter Presentation"}
            </Button>
            <Button variant="outline" className="h-10" onClick={() => setIsPoolDialogOpen(true)}>
              Edit Card Pool
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isPresentationMode ? (
          <m.div
            key="pool-body"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 md:px-6">
              {filteredPoolCardIds.length > 0 ? (
                <div className="max-h-[22vh] overflow-y-auto px-1 pt-1">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
                    {filteredPoolCardIds.map((cardId) => {
                      const card = cardMap.get(cardId.toString());
                      if (!card) {
                        return null;
                      }

                      return (
                        <div key={card._id} className="content-visibility-auto">
                          <CardGridItem
                            card={card}
                            backCard={getBackCard(card)}
                            dragSourceId="tier-list:pool"
                            showDeckActions={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-20 items-center justify-center border-t border-dashed border-border/40 px-4 text-sm text-muted-foreground">
                  {poolScopes.length > 0
                    ? "No cards in the pool match that search."
                    : "Add set and card type rules to populate the card pool."}
                </div>
              )}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
