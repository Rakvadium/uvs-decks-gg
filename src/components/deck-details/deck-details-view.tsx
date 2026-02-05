"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Layers,
  BookOpen,
  Bookmark,
  Edit3,
  Save,
  X,
  Zap,
  Globe,
  Lock,
  Hexagon,
  User,
  LayoutGrid,
  BarChart3,
  Shuffle,
  Download,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardDetailsDialog } from "@/components/universus";
import { cn } from "@/lib/utils";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useCardData, type CachedCard } from "@/lib/universus";
import { formatUniversusCardType } from "@/config/universus";

interface DeckDetailsViewProps {
  deckId: string;
}

type DeckSection = "main" | "side" | "reference";

const SECTION_CONFIG = {
  main: { label: "Main Deck", icon: Layers, color: "primary" },
  side: { label: "Sideboard", icon: BookOpen, color: "secondary" },
  reference: { label: "Reference", icon: Bookmark, color: "accent" },
} as const;

const CARD_TYPE_ORDER = ["Attack", "Foundation", "Action", "Asset", "Backup", "Character"] as const;
const CARD_TYPE_LABELS: Record<string, string> = {
  Attack: "Attacks",
  Foundation: "Foundations",
  Action: "Actions",
  Asset: "Assets",
  Backup: "Backups",
  Character: "Characters",
};

function DeckCardStackItem({
  card,
  quantity,
  backCard,
}: {
  card: CachedCard;
  quantity: number;
  backCard?: CachedCard | null;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const stackCount = Math.max(1, quantity);
  const stackOffset = 6;
  const stackedLayers = Array.from({ length: Math.max(0, stackCount - 1) }, (_, index) => index + 1);

  const handleOpen = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsDialogOpen(true);
    }
  }, []);

  return (
    <>
      <div className="group flex flex-col gap-2">
        <div className="relative pr-6 pb-6">
          <div className="relative aspect-[2.5/3.5] overflow-visible">
          {stackedLayers.map((layer) => (
            <div
              key={layer}
              aria-hidden="true"
              className="absolute inset-0 rounded-lg border border-border/80 bg-muted/70 ring-1 ring-white/10 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.7)] pointer-events-none"
              style={{
                transform: `translate(${layer * stackOffset}px, ${layer * stackOffset}px)`,
                opacity: Math.max(0.55, 0.9 - layer * 0.08),
              }}
            />
          ))}

          <button
            type="button"
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            className={cn(
              "absolute inset-0 z-10 rounded-lg overflow-hidden",
              "shadow-[0_10px_30px_-16px_rgba(0,0,0,0.7)]",
              "transition-transform duration-300",
              !prefersReducedMotion && "group-hover:-translate-x-1 group-hover:-translate-y-1"
            )}
            aria-label={`Open ${card.name} details`}
          >
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                className="object-cover"
                loading="lazy"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/50 border border-border/50">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded border border-primary/30 flex items-center justify-center">
                    <span className="text-primary/50 text-lg">?</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">No Image</span>
                </div>
              </div>
            )}
          </button>

          <div className="absolute top-2 right-2 z-20">
            <Badge variant="outline" className="text-[10px] font-mono bg-background/80 backdrop-blur-sm">
              x{quantity}
            </Badge>
          </div>
          </div>
        </div>

        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground truncate" title={card.name}>
          {card.name}
        </div>
      </div>

      <CardDetailsDialog
        card={card}
        backCard={backCard}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}

function DeckStatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = "primary" 
}: { 
  icon: typeof Layers; 
  label: string; 
  value: string | number; 
  color?: "primary" | "secondary" | "accent";
}) {
  const colorClasses = {
    primary: "text-primary border-primary/30 bg-primary/10",
    secondary: "text-secondary border-secondary/30 bg-secondary/10",
    accent: "text-accent border-accent/30 bg-accent/10",
  };
  
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border", colorClasses[color])}>
      <Icon className="h-5 w-5" />
      <div className="flex flex-col">
        <span className="text-xl font-display font-bold">{value}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">{label}</span>
      </div>
    </div>
  );
}

function GallerySidebar() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-primary" />
        <span className="text-sm font-mono uppercase tracking-wider">Quick Add</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Browse and add cards from the gallery
      </p>
      <Link href="/gallery">
        <Button variant="outline" size="sm" className="w-full">
          Open Gallery
        </Button>
      </Link>
    </div>
  );
}

function StatsSidebar() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-secondary" />
        <span className="text-sm font-mono uppercase tracking-wider">Deck Stats</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Deck statistics and analytics coming soon
      </p>
    </div>
  );
}

function HandSimulatorSidebar() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shuffle className="h-4 w-4 text-accent" />
        <span className="text-sm font-mono uppercase tracking-wider">Starting Hand</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Test your opening hands
      </p>
      <Button variant="outline" size="sm" className="w-full" disabled>
        Coming Soon
      </Button>
    </div>
  );
}

function ImportExportSidebar() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-primary" />
        <span className="text-sm font-mono uppercase tracking-wider">Import / Export</span>
      </div>
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full" disabled>
          Export Deck
        </Button>
        <Button variant="outline" size="sm" className="w-full" disabled>
          Import Cards
        </Button>
      </div>
    </div>
  );
}

export function DeckDetailsView({ deckId }: DeckDetailsViewProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { cards: allCards } = useCardData();
  const { activeDeckId, setActiveDeck } = useActiveDeck();
  const gallerySlotOptions = useMemo(() => ({ label: "Gallery", icon: LayoutGrid }), []);
  const statsSlotOptions = useMemo(() => ({ label: "Stats", icon: BarChart3 }), []);
  const simulatorSlotOptions = useMemo(() => ({ label: "Simulator", icon: Shuffle }), []);
  const importExportSlotOptions = useMemo(() => ({ label: "Import/Export", icon: Download }), []);
  
  const deck = useQuery(api.decks.getById, { deckId: deckId as Id<"decks"> });
  const formats = useQuery(api.formats.list, {});
  const updateDeck = useMutation(api.decks.update);
  const deleteDeck = useMutation(api.decks.deleteDeck);
  
  const [activeSection, setActiveSection] = useState<DeckSection>("main");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFormat, setEditFormat] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useRegisterSlot("right-sidebar", "deck-gallery", GallerySidebar, gallerySlotOptions);
  useRegisterSlot("right-sidebar", "deck-stats", StatsSidebar, statsSlotOptions);
  useRegisterSlot("right-sidebar", "deck-simulator", HandSimulatorSidebar, simulatorSlotOptions);
  useRegisterSlot("right-sidebar", "deck-import-export", ImportExportSidebar, importExportSlotOptions);

  const cardIdMap = useMemo(() => {
    const map = new Map<string, CachedCard>();
    for (const card of allCards) {
      map.set(card._id, card);
    }
    return map;
  }, [allCards]);

  const mainCards = useMemo(() => {
    if (!deck) return [];
    return deck.mainCardIds
      .map(id => cardIdMap.get(id))
      .filter(Boolean) as CachedCard[];
  }, [deck, cardIdMap]);

  const sideCards = useMemo(() => {
    if (!deck) return [];
    return deck.sideCardIds
      .map(id => cardIdMap.get(id))
      .filter(Boolean) as CachedCard[];
  }, [deck, cardIdMap]);

  const referenceCards = useMemo(() => {
    if (!deck) return [];
    return deck.referenceCardIds
      .map(id => cardIdMap.get(id))
      .filter(Boolean) as CachedCard[];
  }, [deck, cardIdMap]);

  const startingCharacter = useMemo(() => {
    if (!deck?.startingCharacterId) return null;
    return cardIdMap.get(deck.startingCharacterId) ?? null;
  }, [deck, cardIdMap]);

  const imageCard = useMemo(() => {
    if (!deck?.imageCardId) return null;
    return cardIdMap.get(deck.imageCardId) ?? null;
  }, [deck, cardIdMap]);

  const counts = useMemo(() => ({
    main: deck ? Object.values(deck.mainQuantities).reduce((sum, qty) => sum + qty, 0) : 0,
    side: deck ? Object.values(deck.sideQuantities).reduce((sum, qty) => sum + qty, 0) : 0,
    reference: deck ? Object.values(deck.referenceQuantities).reduce((sum, qty) => sum + qty, 0) : 0,
  }), [deck]);

  const currentCards = activeSection === "main" ? mainCards : activeSection === "side" ? sideCards : referenceCards;
  const currentQuantities = deck ? (activeSection === "main" ? deck.mainQuantities : activeSection === "side" ? deck.sideQuantities : deck.referenceQuantities) : {};
  
  const visibleCards = useMemo(() => {
    return currentCards.filter((card) => (currentQuantities[card._id.toString()] ?? 0) > 0);
  }, [currentCards, currentQuantities]);

  const sortedCards = useMemo(() => {
    const cardsCopy = [...visibleCards];
    cardsCopy.sort((a, b) => {
      const difficultyA = typeof a.difficulty === "number" ? a.difficulty : Number.POSITIVE_INFINITY;
      const difficultyB = typeof b.difficulty === "number" ? b.difficulty : Number.POSITIVE_INFINITY;
      if (difficultyA !== difficultyB) return difficultyA - difficultyB;
      return (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
    });
    return cardsCopy;
  }, [visibleCards]);

  const groupedCards = useMemo(() => {
    const groups = new Map<string, CachedCard[]>();
    for (const card of sortedCards) {
      const normalizedType = formatUniversusCardType(card.type) ?? card.type ?? "Other";
      const list = groups.get(normalizedType) ?? [];
      list.push(card);
      groups.set(normalizedType, list);
    }

    const orderedTypes = [
      ...CARD_TYPE_ORDER,
      ...Array.from(groups.keys())
        .filter((type) => !CARD_TYPE_ORDER.includes(type as (typeof CARD_TYPE_ORDER)[number]))
        .sort(),
    ];

    return orderedTypes
      .filter((type) => groups.has(type))
      .map((type) => ({
        type,
        label: CARD_TYPE_LABELS[type] ?? type,
        cards: groups.get(type) ?? [],
      }));
  }, [sortedCards]);

  const isActiveDeck = !!(deck && activeDeckId === deck._id);

  const startEditing = useCallback(() => {
    if (deck) {
      setEditName(deck.name);
      setEditDescription(deck.description || "");
      setEditFormat(deck.format || "");
      setEditIsPublic(deck.isPublic);
      setIsEditing(true);
    }
  }, [deck]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const saveEdits = useCallback(async () => {
    if (!deck) return;
    setIsSaving(true);
    try {
      await updateDeck({
        deckId: deck._id,
        name: editName.trim() || deck.name,
        description: editDescription.trim() || undefined,
        isPublic: editIsPublic,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [deck, editName, editDescription, editFormat, editIsPublic, updateDeck]);

  const handleDelete = useCallback(async () => {
    if (!deck) return;
    setIsDeleting(true);
    try {
      await deleteDeck({ deckId: deck._id });
      router.push("/decks");
    } catch {
      setIsDeleting(false);
    }
  }, [deck, deleteDeck, router]);

  const handleSetActiveDeck = useCallback(() => {
    if (deck) {
      setActiveDeck(deck._id);
    }
  }, [deck, setActiveDeck]);

  if (!deck) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary drop-shadow-[0_0_10px_var(--primary)]" />
          <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
            Loading Deck Data
          </span>
        </div>
      </div>
    );
  }

  const displayImage = imageCard?.imageUrl || startingCharacter?.imageUrl;

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl blur-xl" />
        
        <div className="relative flex flex-col lg:flex-row gap-6">
          <div className="relative w-full lg:w-48 h-48 lg:h-64 rounded-xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/10 via-card to-secondary/10 shrink-0">
            {displayImage ? (
              <>
                <Image
                  src={displayImage}
                  alt={deck.name}
                  fill
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Hexagon className="h-20 w-20 text-primary/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Layers className="h-8 w-8 text-primary/40" />
                  </div>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <Badge 
                variant={deck.isPublic ? "default" : "outline"}
                className="text-[9px]"
              >
                {deck.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                {deck.isPublic ? "Public" : "Private"}
              </Badge>
              
              {counts.main >= 60 && (
                <Badge variant="default" className="text-[9px] bg-green-500/20 text-green-500 border-green-500/30">
                  <Check className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link href="/decks">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xl font-display font-bold uppercase tracking-wide h-auto py-1"
                      placeholder="Deck name..."
                    />
                  ) : (
                    <h1 className="text-2xl font-display font-bold uppercase tracking-widest">
                      {deck.name}
                    </h1>
                  )}
                </div>
                
                {isEditing ? (
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="text-sm min-h-[60px]"
                  />
                ) : deck.description ? (
                  <p className="text-sm text-muted-foreground pl-10">
                    {deck.description}
                  </p>
                ) : null}
                
                <div className="flex items-center gap-3 pl-10 pt-1">
                  {isEditing ? (
                    <>
                      <Select value={editFormat} onValueChange={setEditFormat}>
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          {formats?.map(f => (
                            <SelectItem key={f.key} value={f.key}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center gap-2">
                        <Switch checked={editIsPublic} onCheckedChange={setEditIsPublic} />
                        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                          Public
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {deck.format && (
                        <Badge variant="cyber" className="text-[10px]">
                          {deck.format}
                          {deck.subFormat && ` / ${deck.subFormat}`}
                        </Badge>
                      )}
                      
                      {startingCharacter && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-secondary" />
                          <span className="text-xs font-mono text-muted-foreground">
                            {startingCharacter.name}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdits} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant={isActiveDeck ? "default" : "outline"} 
                      size="sm"
                      onClick={handleSetActiveDeck}
                      disabled={isActiveDeck}
                    >
                      <Zap className={cn("h-4 w-4 mr-1", isActiveDeck && "text-yellow-400")} />
                      {isActiveDeck ? "Active" : "Set Active"}
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={startEditing}>
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Deck</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{deck.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 pl-10">
              <DeckStatCard icon={Layers} label="Main Deck" value={counts.main} color="primary" />
              <DeckStatCard icon={BookOpen} label="Sideboard" value={counts.side} color="secondary" />
              <DeckStatCard icon={Bookmark} label="Reference" value={counts.reference} color="accent" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/30 border border-border/50 w-fit">
          {(["main", "side", "reference"] as DeckSection[]).map((section) => {
            const config = SECTION_CONFIG[section];
            const Icon = config.icon;
            const count = counts[section];
            const isActive = activeSection === section;
            
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-mono uppercase tracking-wider transition-all",
                  isActive
                    ? "bg-primary/20 text-primary shadow-[0_0_10px_-3px_var(--primary)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {config.label}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  isActive ? "bg-primary/30" : "bg-muted"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {visibleCards.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-lg border border-primary/30 flex items-center justify-center mb-4 shadow-[0_0_20px_-5px_var(--primary)]">
                <Layers className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm mb-4">
                No cards in {SECTION_CONFIG[activeSection].label.toLowerCase()}
              </p>
              <Link href="/gallery">
                <Button variant="neon">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Browse Gallery
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedCards.map((group) => {
              const totalCount = group.cards.reduce((sum, card) => {
                return sum + (currentQuantities[card._id.toString()] ?? 0);
              }, 0);

              return (
                <div key={group.type} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display font-bold uppercase tracking-[0.2em]">
                        {group.label}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                        {totalCount}
                      </Badge>
                    </div>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {group.cards.map((card, index) => {
                      const quantity = currentQuantities[card._id.toString()] ?? 0;
                      const backCard = card.backCardId ? cardIdMap.get(card.backCardId) : undefined;

                      return (
                        <motion.div
                          key={card._id}
                          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: prefersReducedMotion ? 0 : Math.min(index * 0.03, 0.4),
                          }}
                        >
                          <DeckCardStackItem card={card} quantity={quantity} backCard={backCard} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
