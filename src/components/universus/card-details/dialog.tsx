"use client";

import { useState } from "react";
import type { CachedCard } from "@/lib/universus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { CardDetailsContent } from "./content";
import { CardDetailsImagePanel } from "./image-panel";

interface CardDetailsDialogProps {
  card: CachedCard | null;
  backCard?: CachedCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDetailsDialog({ card, backCard, open, onOpenChange }: CardDetailsDialogProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!card) return null;

  const displayCard = isFlipped && backCard ? backCard : card;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden p-0 md:pb-6" showCloseButton={false}>
        <DialogTitle className="sr-only">{displayCard.name} - Card Details</DialogTitle>

        <div className="flex flex-col pb-16 lg:flex-row md:pb-0">
          <CardDetailsImagePanel
            displayCard={displayCard}
            deckCard={card}
            hasBack={Boolean(backCard)}
            isFlipped={isFlipped}
            onToggleFlip={() => setIsFlipped((value) => !value)}
          />
          <CardDetailsContent card={displayCard} />
        </div>

        <DialogFooter className="md:hidden">
          <DialogClose asChild>
            <div className="flex w-full items-center justify-end">
              <Button className="ml-auto gap-2">
                <span className="text-xs font-mono uppercase tracking-wider">Close</span>
              </Button>
            </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
