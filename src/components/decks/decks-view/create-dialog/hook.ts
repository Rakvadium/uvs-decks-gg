import { useCallback, useState, type KeyboardEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useDecks } from "@/providers/DecksProvider";

export function useDeckCreateDialogModel() {
  const { state, actions } = useDecks();
  const createDeck = useMutation(api.decks.create);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!newDeckName.trim()) return;

    setIsCreating(true);
    try {
      await createDeck({ name: newDeckName });
      setNewDeckName("");
      actions.closeCreateDialog();
    } finally {
      setIsCreating(false);
    }
  }, [actions, createDeck, newDeckName]);

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
