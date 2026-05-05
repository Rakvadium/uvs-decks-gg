"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DeckInvitePendingGateProps {
  deckId: Id<"decks">;
  deckName: string;
}

export function DeckInvitePendingGate({ deckId, deckName }: DeckInvitePendingGateProps) {
  const accept = useMutation(api.deckShares.acceptInvite);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAccept = async () => {
    setBusy(true);
    setError(null);
    try {
      await accept({ deckId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase tracking-wider">Shared deck</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{deckName}</span>
            <span className="mt-1 block">Accept the invite to view this deck.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="button" className="w-full" disabled={busy} onClick={() => void onAccept()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept invite"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
