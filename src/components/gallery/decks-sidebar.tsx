"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import {
  Bookmark,
  BookOpen,
  Check,
  FolderOpen,
  Globe,
  Layers,
  Loader2,
  Lock,
  Plus,
  Search,
  Trophy,
} from "lucide-react";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DeckTab = "my-decks" | "public" | "tournament";

const TABS: { id: DeckTab; label: string; icon: typeof FolderOpen }[] = [
  { id: "my-decks", label: "My Decks", icon: FolderOpen },
  { id: "public", label: "Public", icon: Globe },
  { id: "tournament", label: "Tournament", icon: Trophy },
];

type DeckData = Doc<"decks">;

function DeckSidebarItem({
  deck,
  isOwner,
  isActive,
  onSetActive,
}: {
  deck: DeckData;
  isOwner: boolean;
  isActive: boolean;
  onSetActive: (deckId: string) => void;
}) {
  const mainCount = useMemo(
    () => Object.values(deck.mainQuantities).reduce((sum, qty) => sum + qty, 0),
    [deck.mainQuantities]
  );
  const sideCount = useMemo(
    () => Object.values(deck.sideQuantities).reduce((sum, qty) => sum + qty, 0),
    [deck.sideQuantities]
  );
  const referenceCount = useMemo(
    () => Object.values(deck.referenceQuantities).reduce((sum, qty) => sum + qty, 0),
    [deck.referenceQuantities]
  );
  const readinessLabel = mainCount >= 60 ? "Ready" : "Building";

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-card/40 p-3 space-y-2 transition-colors",
        isActive && "border-primary/40 bg-primary/5 shadow-[0_0_20px_-12px_var(--primary)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/decks/${deck._id}`}
              className="truncate font-display text-sm font-bold uppercase tracking-wide hover:text-primary transition-colors"
              title={deck.name}
            >
              {deck.name}
            </Link>
            {isActive && (
              <Badge
                variant="outline"
                className="text-[9px] font-mono uppercase tracking-wider border-primary/40 text-primary"
              >
                Active
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {deck.isPublic ? (
                <Globe className="h-3 w-3 text-primary" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {deck.isPublic ? "Public" : "Private"}
            </span>
            {deck.format && (
              <span className="text-primary/80">{deck.format}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <div className="flex items-center gap-1 text-primary/80">
          <Layers className="h-3.5 w-3.5" />
          <span>{mainCount}</span>
        </div>
        {sideCount > 0 && (
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{sideCount}</span>
          </div>
        )}
        {referenceCount > 0 && (
          <div className="flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5" />
            <span>{referenceCount}</span>
          </div>
        )}
        <span
          className={cn(
            "ml-auto rounded px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border",
            mainCount >= 60
              ? "border-green-500/30 text-green-500 bg-green-500/10"
              : "border-orange-500/30 text-orange-500 bg-orange-500/10"
          )}
        >
          {readinessLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        {isOwner ? (
          <Button
            variant={isActive ? "secondary" : "outline"}
            size="sm"
            className="h-7 px-2 text-[10px] font-mono"
            onClick={() => {
              if (!isActive) onSetActive(deck._id);
            }}
          >
            {isActive && <Check className="h-3 w-3" />}
            {isActive ? "Active" : "Set Active"}
          </Button>
        ) : (
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Creator only
          </span>
        )}
        <Link
          href={`/decks/${deck._id}`}
          className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          Open
        </Link>
      </div>
    </div>
  );
}

export function DecksSidebar() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const [activeTab, setActiveTab] = useState<DeckTab>("my-decks");
  const [searchQuery, setSearchQuery] = useState("");
  const deckSearch = searchQuery.trim();

  const myDecksAll = useQuery(
    api.decks.listByUser,
    user ? { userId: user._id } : "skip"
  );
  const publicDecksAll = useQuery(api.decks.listPublic, {});

  const myDecks = useQuery(
    api.decks.listByUser,
    user
      ? {
          userId: user._id,
          ...(deckSearch ? { search: deckSearch } : {}),
        }
      : "skip"
  );
  const publicDecks = useQuery(
    api.decks.listPublic,
    deckSearch ? { search: deckSearch } : {}
  );
  const createDeck = useMutation(api.decks.create);
  const { activeDeckId, setActiveDeck } = useActiveDeck();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const deckCounts = {
    "my-decks": myDecksAll?.length ?? 0,
    "public": publicDecksAll?.length ?? 0,
    "tournament": 0,
  };
  const currentDecks: DeckData[] =
    activeTab === "my-decks"
      ? myDecks ?? []
      : activeTab === "public"
      ? publicDecks ?? []
      : [];

  const isTabLoading =
    authLoading ||
    (activeTab === "my-decks" && isAuthenticated && myDecks === undefined) ||
    (activeTab === "public" && publicDecks === undefined);

  const handleCreate = useCallback(async () => {
    const trimmed = newDeckName.trim();
    if (!trimmed) return;
    setIsCreating(true);
    try {
      const newDeckId = await createDeck({ name: trimmed });
      setActiveDeck(newDeckId);
      setNewDeckName("");
      setIsCreateOpen(false);
    } finally {
      setIsCreating(false);
    }
  }, [newDeckName, createDeck, setActiveDeck]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border/30 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search decks..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        <div className="flex gap-1 p-0.5 rounded-md bg-muted/50 border border-border/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = deckCounts[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all",
                  isActive
                    ? "bg-primary/20 text-primary shadow-[0_0_10px_-3px_var(--primary)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "text-[9px] px-1 py-0.5 rounded",
                      isActive ? "bg-primary/30" : "bg-muted"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 gap-1.5"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">New Deck</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-3 space-y-3">
        {activeTab === "tournament" ? (
          <div className="rounded-lg border border-dashed border-secondary/30 bg-secondary/5 px-4 py-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-secondary/60" />
            <p className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Tournament decks coming soon
            </p>
          </div>
        ) : !isAuthenticated && activeTab === "my-decks" ? (
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-primary/60" />
            <p className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Sign in to manage your decks
            </p>
          </div>
        ) : isTabLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="font-mono uppercase tracking-wider text-xs">Loading decks</span>
          </div>
        ) : currentDecks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-card/30 px-4 py-6 text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {searchQuery.trim()
                ? "No decks match your search"
                : activeTab === "public"
                ? "No public decks available"
                : "No decks yet"}
            </p>
            {!searchQuery.trim() && activeTab === "my-decks" && isAuthenticated && (
              <Button
                variant="neon"
                size="sm"
                className="mt-3"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Create Your First Deck
              </Button>
            )}
          </div>
        ) : (
          currentDecks.map((deck) => {
            const isOwner = user ? deck.userId === user._id : false;
            const isActive = activeDeckId === deck._id;
            return (
              <DeckSidebarItem
                key={deck._id}
                deck={deck}
                isOwner={isOwner}
                isActive={isActive}
                onSetActive={setActiveDeck}
              />
            );
          })
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent size="sm" className="overflow-hidden">
          <div className="relative p-6">
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
              <DialogDescription>
                Name it now, refine it later.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="pt-4">
              <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Deck name
              </label>
              <div className="relative mt-2">
                <Input
                  placeholder="Deck name..."
                  value={newDeckName}
                  onChange={(event) => setNewDeckName(event.target.value)}
                  className="h-11 text-sm"
                  onKeyDown={(event) => event.key === "Enter" && handleCreate()}
                />
              </div>
            </DialogBody>

            <DialogFooter className="mt-4 gap-2 border-t-0 bg-transparent p-0">
              <Button
                variant="outline"
                className="h-10 px-4"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-10 px-4"
                onClick={handleCreate}
                disabled={isCreating || !newDeckName.trim()}
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Deck
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
