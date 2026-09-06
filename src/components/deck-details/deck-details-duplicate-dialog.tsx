"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

export function DeckDetailsDuplicateDialog() {
  const {
    deck,
    isDuplicating,
    isDuplicateConfirmOpen,
    setDuplicateConfirmOpen,
    confirmDuplicate,
  } = useDeckDetails();

  if (!deck) return null;

  return (
    <AlertDialog open={isDuplicateConfirmOpen} onOpenChange={setDuplicateConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Duplicate Deck</AlertDialogTitle>
          <AlertDialogDescription>
            Create a private copy of &quot;{deck.name}&quot;? You can edit the copy without changing
            the original.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDuplicating}>Close</AlertDialogCancel>
          <AlertDialogAction onClick={() => void confirmDuplicate()} disabled={isDuplicating}>
            {isDuplicating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Duplicate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
