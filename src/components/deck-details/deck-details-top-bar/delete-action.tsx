import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useDeckDetailsTopBarContext } from "./context";
import { Spinner } from "@/components/ui/spinner";

interface DeckDetailsTopBarDeleteActionProps {
  compact?: boolean;
}

export function DeckDetailsTopBarDeleteAction({ compact = false }: DeckDetailsTopBarDeleteActionProps) {
  const { deck, isDeleting, deleteDeck } = useDeckDetailsTopBarContext();

  if (!deck) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructiveOutline"
          size={compact ? "icon-sm" : "icon"}
          aria-label="Delete deck"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Deck</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{deck.name}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void deleteDeck()} disabled={isDeleting}>
            {isDeleting ? <Spinner /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
