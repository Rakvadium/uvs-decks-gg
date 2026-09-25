import { useCallback, useState, type KeyboardEvent } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useDecks } from "@/providers/DecksProvider";
import { useGameId } from "@/games/game-context";

export function useDeckCreateDialogModel() {
  const { state, actions } = useDecks();
  const { setActiveDeck } = useActiveDeck();
  const game = useGameId();
  const createDeck = useMutation(api.decks.create);
  const router = useRouter();
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!newDeckName.trim()) return;

    setIsCreating(true);
    try {
      const newDeckId = await createDeck({ game, name: newDeckName });
      setActiveDeck(newDeckId);
      setNewDeckName("");
      actions.closeCreateDialog();
      router.push(`/decks/${newDeckId}`);
    } finally {
      setIsCreating(false);
    }
  }, [actions, createDeck, game, newDeckName, router, setActiveDeck]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        actions.openCreateDialog();
        return;
      }

      actions.closeCreateDialog();
    },
    [actions]
  );

  const handleNameKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        void handleCreate();
      }
    },
    [handleCreate]
  );

  return {
    isOpen: state.isCreateDialogOpen,
    newDeckName,
    isCreating,
    canCreate: Boolean(newDeckName.trim()) && !isCreating,
    setNewDeckName,
    handleCreate,
    handleOpenChange,
    handleNameKeyDown,
    closeDialog: actions.closeCreateDialog,
  };
}
