"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";
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
import { useRouter } from "next/navigation";

interface DeckDetailsViewProps {
  deckId: string;
}

export function DeckDetailsView({ deckId }: DeckDetailsViewProps) {
  const router = useRouter();
  const deck = useQuery(api.decks.getById, { deckId: deckId as Id<"decks"> });
  const mainCards = useQuery(
    api.cards.getByIds,
    deck?.mainCardIds ? { cardIds: deck.mainCardIds } : "skip"
  );
  const updateDeck = useMutation(api.decks.update);
  const deleteDeck = useMutation(api.decks.deleteDeck);
  
  const [name, setName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!deck) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName = name ?? deck.name;

  const handleNameChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const newName = e.target.value.trim();
    if (newName && newName !== deck.name) {
      await updateDeck({ deckId: deck._id, name: newName });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDeck({ deckId: deck._id });
      router.push("/decks");
    } catch {
      setIsDeleting(false);
    }
  };

  const totalCards = Object.values(deck.mainQuantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/decks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <Input
            value={displayName}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameChange}
            className="text-2xl font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
          />
          <p className="text-muted-foreground">
            {totalCards} cards
            {deck.format && ` • ${deck.format}`}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Main Deck
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCards}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{deck.mainCardIds.length}</p>
          </CardContent>
        </Card>
        {deck.selectedIdentity && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Identity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge>{deck.selectedIdentity}</Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {mainCards && mainCards.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Cards</h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {mainCards.map((card) => {
              const quantity = deck.mainQuantities[card._id.toString()] ?? 0;
              return (
                <div
                  key={card._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{card.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {card.type}
                      {card.rarity && ` • ${card.rarity}`}
                    </p>
                  </div>
                  <Badge variant="secondary">x{quantity}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No cards in this deck</p>
            <p className="text-sm text-muted-foreground mt-2">
              Visit the gallery to add cards to your deck
            </p>
            <Link href="/gallery" className="mt-4">
              <Button>Browse Gallery</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
