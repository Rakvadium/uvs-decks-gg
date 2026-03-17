"use client";

import { useState } from "react";
import type { CachedCard } from "@/lib/universus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
      <DialogContent
        size="lg"
        className="overflow-hidden p-0 md:max-h-[90vh]"
        showCloseButton={false}
        footer={
          <DialogClose asChild>
            <Button variant="outline">
              <span className="text-xs font-mono uppercase tracking-wider">Close</span>
            </Button>
          </DialogClose>
        }
      >
        <DialogTitle className="sr-only">{displayCard.name} - Card Details</DialogTitle>

        <div className="flex h-full min-h-0 flex-col lg:flex-row">
          <CardDetailsImagePanel
            displayCard={displayCard}
            deckCard={card}
            hasBack={Boolean(backCard)}
            isFlipped={isFlipped}
            onToggleFlip={() => setIsFlipped((value) => !value)}
          />
          <CardDetailsContent card={displayCard} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
