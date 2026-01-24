"use client";

import { Library, Layers, LayoutGrid, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Welcome to UniVersus</h1>
          <p className="text-lg text-muted-foreground">
            The UniVersus Trading Card Game
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link href={`/gallery`}>
            <div className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Card Gallery</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse all available cards
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          <Link href={`/decks`}>
            <div className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">My Decks</h3>
                  <p className="text-sm text-muted-foreground">
                    Build and manage your decks
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          <Link href={`/collection`}>
            <div className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Library className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Collection</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your card collection
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Start exploring the card gallery, create your first deck, or track your collection.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href={`/gallery`}>Explore Cards</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/decks`}>Create a Deck</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
