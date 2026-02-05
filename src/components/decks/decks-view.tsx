"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Loader2, 
  Layers, 
  Search, 
  Trophy, 
  FolderOpen,
  Globe,
  Lock,
  PenLine,
} from "lucide-react";
import { DeckGridItem } from "./deck-grid-item";
import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { cn } from "@/lib/utils";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { Separator } from "@/components/ui/separator";
import { useDecks, useDecksOptional } from "@/providers/DecksProvider";

type DeckTab = "my-decks" | "public" | "tournament";

const TABS: { id: DeckTab; label: string; icon: typeof FolderOpen }[] = [
  { id: "my-decks", label: "My Decks", icon: FolderOpen },
  { id: "public", label: "Public", icon: Globe },
  { id: "tournament", label: "Tournament", icon: Trophy },
];

function DecksTopBar() {
  const context = useDecksOptional();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const myDecks = useQuery(
    api.decks.listByUser,
    user ? { userId: user._id } : "skip"
  );
  const publicDecks = useQuery(api.decks.listPublic, {});
  
  if (!context) return null;
  
  const { state, actions } = context;

  const deckCounts = {
    "my-decks": myDecks?.length || 0,
    "public": publicDecks?.length || 0,
    "tournament": 0,
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search decks..."
          value={state.searchQuery}
          onChange={(e) => actions.setSearchQuery(e.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <div className="flex gap-1 p-0.5 rounded-md bg-muted/50 border border-border/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = state.activeTab === tab.id;
          const count = deckCounts[tab.id];
          
          return (
            <button
              key={tab.id}
              onClick={() => actions.setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all",
                isActive
                  ? "bg-primary/20 text-primary shadow-[0_0_10px_-3px_var(--primary)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {count > 0 && (
                <span className={cn(
                  "text-[10px] px-1 py-0.5 rounded",
                  isActive ? "bg-primary/30" : "bg-muted"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isAuthenticated && (
        <div className="ml-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5"
            onClick={() => actions.openCreateDialog()}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">New Deck</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export function DecksView() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const { state, actions } = useDecks();
  const deckSearch = state.searchQuery.trim();

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
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useRegisterSlot("top-bar", "decks-filters", DecksTopBar);

  const handleCreate = async () => {
    if (!newDeckName.trim()) return;
    setIsCreating(true);
    try {
      await createDeck({ name: newDeckName });
      setNewDeckName("");
      actions.closeCreateDialog();
    } finally {
      setIsCreating(false);
    }
  };

  const currentDecks =
    state.activeTab === "my-decks"
      ? myDecks || []
      : state.activeTab === "public"
      ? publicDecks || []
      : [];

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary drop-shadow-[0_0_10px_var(--primary)]" />
          <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
            Initializing Deck Database
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && state.activeTab === "my-decks") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-lg border border-primary/30 flex items-center justify-center shadow-[0_0_30px_-5px_var(--primary)]">
            <Lock className="h-10 w-10 text-primary/50" />
          </div>
          <p className="text-muted-foreground font-mono uppercase tracking-wider">
            Sign in to view your decks
          </p>
          <Button variant="neon" className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl blur-xl" />
        
        <div className="relative space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
            <h1 className="text-2xl font-display font-bold uppercase tracking-widest">
              Deck Database
            </h1>
          </div>
          <p className="text-muted-foreground font-mono text-sm tracking-wide pl-5">
            Build, browse, and manage decks
          </p>
        </div>
      </div>

      <Dialog open={state.isCreateDialogOpen} onOpenChange={(open) => open ? actions.openCreateDialog() : actions.closeCreateDialog()}>
        <DialogContent size="md" className="overflow-hidden">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 left-10 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-16 right-10 h-24 w-24 rounded-full bg-secondary/20 blur-3xl" />
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            <div className="relative p-6">
              <DialogHeader className="border-border/20 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 shadow-[0_0_20px_-6px_var(--primary)]">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Create New Deck</DialogTitle>
                    <DialogDescription className="text-sm">
                      Give it a name now; you can always refine it later.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <DialogBody className="pt-4">
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  Deck name
                </label>
                <div className="relative mt-2">
                  <PenLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    placeholder="Deck name..."
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    className="h-12 pl-10 text-base bg-background/40 border-border/60 focus-visible:ring-primary/25"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground/70">
                  Tip: Use a format or archetype keyword to make it easier to find later.
                </p>
              </DialogBody>

              <DialogFooter className="mt-6 gap-3 border-t-0 bg-transparent p-0">
                <Button
                  variant="outline"
                  className="h-11 px-6"
                  onClick={() => actions.closeCreateDialog()}
                >
                  Cancel
                </Button>
                <Button
                  className="h-11 px-6"
                  onClick={handleCreate}
                  disabled={isCreating || !newDeckName.trim()}
                >
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Deck
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {state.activeTab === "tournament" ? (
        <Card className="border-dashed border-2 border-secondary/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-lg border border-secondary/30 flex items-center justify-center mb-6 shadow-[0_0_20px_-5px_var(--secondary)]">
              <Trophy className="h-8 w-8 text-secondary/50" />
            </div>
            <h3 className="text-lg font-display font-bold uppercase tracking-wider mb-2">
              Coming Soon
            </h3>
            <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm text-center max-w-md">
              Tournament decks from competitive events will be available here
            </p>
          </CardContent>
        </Card>
      ) : currentDecks.length === 0 ? (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-lg border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_20px_-5px_var(--primary)]">
              {state.searchQuery ? (
                <Search className="h-8 w-8 text-primary/50" />
              ) : (
                <Layers className="h-8 w-8 text-primary/50" />
              )}
            </div>
            {state.searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2 font-mono uppercase tracking-wider text-sm">
                  No decks found
                </p>
                <p className="text-muted-foreground/60 text-sm">
                  Try adjusting your search query
                </p>
              </>
            ) : state.activeTab === "my-decks" ? (
              <>
                <p className="text-muted-foreground mb-6 font-mono uppercase tracking-wider text-sm">
                  No decks yet
                </p>
                <Button variant="neon" onClick={() => actions.openCreateDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Deck
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm">
                No public decks available
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {currentDecks.map((deck) => (
            <DeckGridItem 
              key={deck._id} 
              deck={deck} 
              showAuthor={state.activeTab === "public"}
            />
          ))}
        </div>
      )}

      {currentDecks.length > 0 && (
        <div className="flex items-center justify-center pt-4">
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">
            Showing {currentDecks.length} deck{currentDecks.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
