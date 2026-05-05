"use client";

import { AlertCircle, X } from "lucide-react";
import { useDeckEditor } from "@/lib/deck";
import { isTeamEditableDeck } from "@/lib/deck/visibility";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function TeamEditableWriteConflictBanner() {
  const {
    deck,
    teamEditableWriteConflict,
    dismissTeamEditableWriteConflict,
  } = useDeckEditor();
  if (!deck || !isTeamEditableDeck(deck) || !teamEditableWriteConflict) {
    return null;
  }
  return (
    <Alert className="border-amber-500/40 bg-amber-500/5 pr-10">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-950 dark:text-amber-100">Deck was updated elsewhere</AlertTitle>
      <AlertDescription className="text-amber-900/90 dark:text-amber-200/90">
        Another teammate or tab changed this deck. Your list now matches the server. You can keep editing from here.
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 text-amber-900/80 hover:bg-amber-500/10 hover:text-amber-950 dark:text-amber-200 dark:hover:text-amber-50"
        aria-label="Dismiss"
        onClick={dismissTeamEditableWriteConflict}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
