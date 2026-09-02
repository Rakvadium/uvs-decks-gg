"use client";

import { AlertCircle, X } from "lucide-react";
import { useDeckEditor } from "@/lib/deck";
import { isTeamEditableDeck } from "@/lib/deck/visibility";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TeamEditableWriteConflictBanner({
  className,
}: {
  className?: string;
}) {
  const {
    deck,
    teamEditableWriteConflict,
    dismissTeamEditableWriteConflict,
  } = useDeckEditor();
  if (!deck || !isTeamEditableDeck(deck) || !teamEditableWriteConflict) {
    return null;
  }
  return (
    <Alert variant="warning" className={cn("pr-10", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Deck was updated elsewhere</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        Another teammate or tab changed this deck. Your list now matches the server. You can keep editing from here.
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-2 top-2"
        aria-label="Dismiss"
        onClick={dismissTeamEditableWriteConflict}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
