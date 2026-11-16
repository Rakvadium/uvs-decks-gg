import { Layers } from "lucide-react";
import { CreateEntityDialog } from "@/components/ui/create-entity-dialog";
import { useDecksSidebarContext } from "./context";

export function DeckCreateDialog() {
  const { handleCreate, isCreateOpen, isCreating, newDeckName, setIsCreateOpen, setNewDeckName } =
    useDecksSidebarContext();

  return (
    <CreateEntityDialog
      open={isCreateOpen}
      onOpenChange={setIsCreateOpen}
      icon={Layers}
      title="Create New Deck"
      description="Give it a name now; you can always refine it later."
      name={{
        id: "gallery-create-deck-name",
        label: "Deck name",
        placeholder: "My Standard Aggro…",
        value: newDeckName,
        onChange: setNewDeckName,
        hint: "Tip: Use a format or archetype keyword to make it easier to find later.",
      }}
      submitLabel="Create Deck"
      submitting={isCreating}
      onSubmit={() => void handleCreate()}
    />
  );
}
