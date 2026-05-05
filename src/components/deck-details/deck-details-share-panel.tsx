"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeDeckVisibility } from "@/lib/deck/visibility";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

export function DeckDetailsSharePanel() {
  const { deck, isOwner } = useDeckDetails();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const invite = useMutation(api.deckShares.inviteUser);
  const revoke = useMutation(api.deckShares.revokeUser);
  const shares = useQuery(
    api.deckShares.listForDeck,
    deck && isOwner && normalizeDeckVisibility(deck) === "share"
      ? { deckId: deck._id }
      : "skip",
  );

  if (!deck || !isOwner || normalizeDeckVisibility(deck) !== "share") return null;

  const onInvite = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await invite({ deckId: deck._id, username: trimmed });
      setUsername("");
      toast.success("Invite sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send invite");
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (targetUserId: Id<"users">) => {
    try {
      await revoke({ deckId: deck._id, targetUserId });
      toast.success("Access updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update access");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-3">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Share with</p>
        <p className="text-xs text-muted-foreground">
          Enter a member&apos;s exact username. They must sign in and accept the invite from this deck link.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="deck-share-username" className="sr-only">
            Username
          </Label>
          <Input
            id="deck-share-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") void onInvite();
            }}
          />
        </div>
        <Button type="button" size="sm" className="h-9 shrink-0" disabled={busy || !username.trim()} onClick={() => void onInvite()}>
          Invite
        </Button>
      </div>
      {shares && shares.length > 0 ? (
        <ul className="space-y-2 border-t border-border/50 pt-3">
          {shares.map((row) => (
            <li key={row._id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate font-medium">
                {row.username ?? row.userId}
                <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {row.status}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Remove access"
                onClick={() => void onRevoke(row.userId)}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
