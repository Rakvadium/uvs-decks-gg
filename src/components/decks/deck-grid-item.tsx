"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Layers, 
  Globe, 
  Lock, 
  User,
  Hexagon,
  BookOpen,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useCardData } from "@/lib/universus";
import { cn } from "@/lib/utils";

interface DeckData {
  _id: Id<"decks">;
  _creationTime: number;
  userId: Id<"users">;
  name: string;
  description?: string;
  isPublic: boolean;
  format?: string;
  subFormat?: string;
  startingCharacterId?: Id<"cards">;
  selectedIdentity?: string;
  imageCardId?: Id<"cards">;
  mainCardIds: Id<"cards">[];
  mainQuantities: Record<string, number>;
  sideCardIds: Id<"cards">[];
  sideQuantities: Record<string, number>;
  referenceCardIds: Id<"cards">[];
  referenceQuantities: Record<string, number>;
}

interface DeckGridItemProps {
  deck: DeckData;
  showAuthor?: boolean;
}

export function DeckGridItem({ deck, showAuthor = false }: DeckGridItemProps) {
  const { cards } = useCardData();
  
  const imageCard = useMemo(() => {
    if (!deck.imageCardId) return null;
    return cards.find(c => c._id === deck.imageCardId);
  }, [deck.imageCardId, cards]);
  
  const startingCharacter = useMemo(() => {
    if (!deck.startingCharacterId) return null;
    return cards.find(c => c._id === deck.startingCharacterId);
  }, [deck.startingCharacterId, cards]);
  
  const mainCount = useMemo(() => {
    return Object.values(deck.mainQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [deck.mainQuantities]);
  
  const sideCount = useMemo(() => {
    return Object.values(deck.sideQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [deck.sideQuantities]);
  
  const referenceCount = useMemo(() => {
    return Object.values(deck.referenceQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [deck.referenceQuantities]);
  
  const displayImage = imageCard?.imageUrl || startingCharacter?.imageUrl;

  return (
    <Link href={`/decks/${deck._id}`}>
      <div className="group relative flex h-[180px] rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_0_30px_-10px_var(--primary)] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-0 left-0 w-[100px] h-px bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-[100px] h-px bg-gradient-to-l from-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative w-[120px] shrink-0 bg-gradient-to-br from-primary/10 via-card to-secondary/10 overflow-hidden">
          {displayImage ? (
            <>
              <Image
                src={displayImage}
                alt={deck.name}
                fill
                className="object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Hexagon className="h-12 w-12 text-primary/20 group-hover:text-primary/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-primary/40" />
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-2 left-2">
            {deck.isPublic ? (
              <div className="p-1.5 rounded bg-primary/30 backdrop-blur-sm border border-primary/40">
                <Globe className="h-3 w-3 text-primary" />
              </div>
            ) : (
              <div className="p-1.5 rounded bg-muted/60 backdrop-blur-sm border border-border/50">
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-4 min-w-0 relative">
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display font-bold text-base uppercase tracking-wide group-hover:text-primary transition-colors truncate">
              {deck.name}
            </h3>
            <ChevronRight className="h-4.5 w-4.5 shrink-0 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          
          {deck.format && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-1 w-1 rounded-full bg-primary shadow-[0_0_4px_var(--primary)]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary/80">
                {deck.format}
                {deck.subFormat && <span className="text-muted-foreground"> / {deck.subFormat}</span>}
              </span>
            </div>
          )}
          
          {deck.description ? (
            <p className="text-[12px] text-muted-foreground line-clamp-2 mb-auto leading-relaxed">
              {deck.description}
            </p>
          ) : startingCharacter ? (
            <div className="flex items-center gap-1.5 mb-auto">
              <div className="w-0.5 h-3 rounded-full bg-secondary/60" />
              <span className="text-[11px] text-muted-foreground font-mono truncate">
                {startingCharacter.name}
              </span>
            </div>
          ) : (
            <div className="mb-auto" />
          )}
          
          <div className="flex items-center gap-2 pt-2.5 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" title="Main Deck">
                <div className="relative">
                  <Layers className="h-4 w-4 text-primary/70" />
                </div>
                <span className="text-sm font-mono font-bold text-foreground">{mainCount}</span>
              </div>
              
              {sideCount > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground" title="Sideboard">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-mono">{sideCount}</span>
                </div>
              )}
              
              {referenceCount > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground" title="Reference">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-mono">{referenceCount}</span>
                </div>
              )}
            </div>
            
            {showAuthor && (
              <div className="flex items-center gap-1 ml-auto">
                <User className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                  User
                </span>
              </div>
            )}
            
            <div className={cn(
              "ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider",
              mainCount >= 60 
                ? "bg-green-500/10 text-green-500 border border-green-500/30" 
                : "bg-orange-500/10 text-orange-500 border border-orange-500/30"
            )}>
              {mainCount >= 60 ? "Ready" : "Building"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
