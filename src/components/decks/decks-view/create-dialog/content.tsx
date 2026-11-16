import { Layers } from "lucide-react";
import { CreateEntityDialog } from "@/components/ui/create-entity-dialog";
import { useDeckCreateDialogModel } from "./hook";

export function DeckCreateDialog() {
  const model = useDeckCreateDialogModel();

  return (
    <CreateEntityDialog
      open={model.isOpen}
      onOpenChange={model.handleOpenChange}
      icon={Layers}
      title="Create New Deck"
      description="Give it a name now; you can always refine it later."
      name={{
        id: "create-deck-name",
        label: "Deck name",
        placeholder: "My Standard Aggro…",
        value: model.newDeckName,
        onChange: model.setNewDeckName,
        hint: "Tip: Use a format or archetype keyword to make it easier to find later.",
      }}
      submitLabel="Create Deck"
      submitting={model.isCreating}
      onSubmit={() => void model.handleCreate()}
    />
  );
}
